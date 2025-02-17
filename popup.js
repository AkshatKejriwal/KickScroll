// Default settings
const DEFAULT_SETTINGS = {
  mouseButton: "right",
  showPercentage: true,
};

// Load settings when popup opens
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Get stored settings or use defaults
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

    // Set radio button based on stored mouseButton setting
    const mouseButtonInput = document.querySelector(
      `input[name="mouseButton"][value="${settings.mouseButton}"]`
    );
    if (mouseButtonInput) {
      mouseButtonInput.checked = true;
    }

    // Set checkbox based on stored showPercentage setting
    document.getElementById("showPercentage").checked = settings.showPercentage;

    // Add save button click handler
    document
      .getElementById("saveSettings")
      .addEventListener("click", saveSettings);
  } catch (error) {
    console.error("Error loading settings:", error);
    showFeedback("Error loading settings", true);
  }
});

function showFeedback(message, isError = false) {
  const saveButton = document.getElementById("saveSettings");
  const originalText = saveButton.textContent;

  saveButton.textContent = message;
  saveButton.style.backgroundColor = isError ? "#dc2626" : "#059669";
  saveButton.disabled = true;

  setTimeout(() => {
    saveButton.textContent = originalText;
    saveButton.style.backgroundColor = "#2563eb";
    saveButton.disabled = false;
  }, 2000);
}

// Save settings
async function saveSettings() {
  try {
    const saveButton = document.getElementById("saveSettings");
    saveButton.disabled = true;

    const mouseButton = document.querySelector(
      'input[name="mouseButton"]:checked'
    ).value;
    const showPercentage = document.getElementById("showPercentage").checked;

    // Save to chrome.storage.sync
    await chrome.storage.sync.set({
      mouseButton,
      showPercentage,
    });

    // Notify the content script that settings have changed
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      try {
        await chrome.tabs.sendMessage(tabs[0].id, {
          type: "SETTINGS_UPDATED",
          settings: { mouseButton, showPercentage },
        });
        showFeedback("Settings saved!");
      } catch (error) {
        // This error occurs if the content script is not ready yet
        // The settings are still saved, so we show a different message
        showFeedback("Saved! Refresh page to apply");
      }
    } else {
      showFeedback("Settings saved!");
    }
  } catch (error) {
    console.error("Error saving settings:", error);
    showFeedback("Error saving settings", true);
  }
}
