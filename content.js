
console.log("Emoji Toggle content script loaded.");

const TOGGLE_MAP = {
	"✅": "❌",
	"❌": "✅"
};

chrome.runtime.onMessage.addListener(
	(message, sender, sendResponse) => {
		if (message.type !== "TOGGLE_EMOJI") return;

		getReplacement()
			.then(sendResponse)
			.catch(error => {
				sendResponse({
					success: false,
					error: error.message
				});
			});

		return true;
	}
);

async function getReplacement() {
	const iframe = document.querySelector(
		"iframe.docs-texteventtarget-iframe"
	);

	if (!iframe?.contentDocument) {
		return {
			success: false,
			reason: "iframe-not-found"
		};
	}

	const iframeDocument = iframe.contentDocument;

	// Copy the current Google Docs selection.
	const copied = iframeDocument.execCommand("copy");

	if (!copied) {
		return {
			success: false,
			reason: "copy-failed"
		};
	}

	const selectedText = await navigator.clipboard.readText();

	console.log("Selected text:", selectedText);

	const replacement = TOGGLE_MAP[selectedText];

	if (!replacement) {
		return {
			success: false,
			reason: "unsupported-selection",
			selectedText
		};
	}

	return {
		success: true,
		selectedText,
		replacement
	};
}
