// Get references to the UI elements
const musicCheckbox = document.getElementById("music-playback");
const videoSpeedSelect = document.getElementById("video-speed");
const saveButton = document.getElementById("save-settings");

// Load saved settings when popup opens
browser.storage.local.get(["musicPlayback", "videoSpeed"]).then((result) => {
  musicCheckbox.checked = result.musicPlayback ?? false;
  videoSpeedSelect.value = result.videoSpeed ?? "1.0";
});

// Save settings
saveButton.addEventListener("click", () => {
  const settings = {
    musicPlayback: musicCheckbox.checked,
    videoSpeed: videoSpeedSelect.value
  };

  browser.storage.local.set(settings).then(() => {
    // Send message to content script to update current video
    browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (tabs[0]) {
        browser.tabs.sendMessage(tabs[0].id, {
          type: "SETTINGS_UPDATED",
          settings: settings
        }).catch(error => console.log("Error sending message:", error));
      }
    });

    // Visual feedback
    saveButton.textContent = "Saved!";
    setTimeout(() => {
      saveButton.textContent = "Save Settings";
    }, 2000);
  });
});

// Log settings when saved (for debugging)
browser.storage.onChanged.addListener((changes, namespace) => {
  console.log('Settings changed:', changes);
});