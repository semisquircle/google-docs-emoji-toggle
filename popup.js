
const enabledCheckbox = document.getElementById("enabled");

// Load the saved setting.
// Default to enabled if no setting exists.
async function loadSettings() {
  const { enabled = true } =
    await chrome.storage.local.get("enabled");

  enabledCheckbox.checked = enabled;
}

// Save the setting whenever the switch changes.
enabledCheckbox.addEventListener("change", async () => {
  const enabled = enabledCheckbox.checked;

  try {
    await chrome.storage.local.set({ enabled });
    console.log("Emoji Toggle enabled:", enabled);
  } catch (error) {
    console.error("Failed to save setting:", error);
    enabledCheckbox.checked = !enabled;
  }
});

loadSettings();
