
const attachedTabs = new Set();
const pendingTabs = new Set();

// Keep our connection state synchronized with Chrome.
chrome.debugger.onDetach.addListener((source, reason) => {
	if (source.tabId !== undefined) {
		attachedTabs.delete(source.tabId);
		console.log(
			"Debugger detached:",
			source.tabId,
			reason
		);
	}
});

// Clean up when a tab is closed.
chrome.tabs.onRemoved.addListener((tabId) => {
	attachedTabs.delete(tabId);
	pendingTabs.delete(tabId);
});

// Attach only if we aren't already connected.
async function ensureDebugger(tabId) {
	if (attachedTabs.has(tabId)) return;

	const target = { tabId };

	await chrome.debugger.attach(target, "1.3");

	attachedTabs.add(tabId);

	console.log("Debugger attached to tab:", tabId);
}

// Send a keyboard event through Chrome DevTools Protocol.
async function sendKey(tabId, {
	key,
	code,
	windowsVirtualKeyCode,
	nativeVirtualKeyCode,
	modifiers = 0
}) {
	const target = { tabId };

	await chrome.debugger.sendCommand(
		target,
		"Input.dispatchKeyEvent",
		{
			type: "rawKeyDown",
			key,
			code,
			windowsVirtualKeyCode,
			nativeVirtualKeyCode,
			modifiers
		}
	);

	await chrome.debugger.sendCommand(
		target,
		"Input.dispatchKeyEvent",
		{
			type: "keyUp",
			key,
			code,
			windowsVirtualKeyCode,
			nativeVirtualKeyCode,
			modifiers
		}
	);
}

// Prevent simultaneous toggles in the same tab.
async function toggleEmoji(tabId) {
	if (pendingTabs.has(tabId)) return;

	pendingTabs.add(tabId);

	try {
		const response = await chrome.tabs.sendMessage(
			tabId,
			{ type: "TOGGLE_EMOJI" },
			{ frameId: 0 }
		);

		console.log("Selection response:", response);

		if (!response?.success) {
			console.warn("Could not identify emoji:", response);
			return;
		}

		await ensureDebugger(tabId);

		const target = { tabId };

		// Delete the original selected emoji.
		await sendKey(tabId, {
			key: "Backspace",
			code: "Backspace",
			windowsVirtualKeyCode: 8,
			nativeVirtualKeyCode: 51
		});

		// Insert the replacement emoji.
		await chrome.debugger.sendCommand(
			target,
			"Input.insertText",
			{
				text: response.replacement
			}
		);

		console.log("Inserted:", response.replacement);

		// Select the emoji we just inserted.
		// Shift modifier = 8 in Chrome DevTools Protocol.
		await sendKey(tabId, {
			key: "ArrowLeft",
			code: "ArrowLeft",
			windowsVirtualKeyCode: 37,
			nativeVirtualKeyCode: 123,
			modifiers: 8
		});

		console.log("Replacement emoji selected.");

	} catch (error) {
		console.error("Emoji toggle failed:", error);

	} finally {
		pendingTabs.delete(tabId);
	}
}

// Listen for the keyboard shortcut.
chrome.commands.onCommand.addListener(async (command) => {
	if (command !== "toggle-emoji") return;

	const [tab] = await chrome.tabs.query({
		active: true,
		currentWindow: true
	});

	if (!tab?.id) return;

	if (!tab.url?.startsWith(
		"https://docs.google.com/document/"
	)) {
		return;
	}

	await toggleEmoji(tab.id);
});
