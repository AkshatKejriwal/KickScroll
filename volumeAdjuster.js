function waitForElement(selector, callback) {
  const interval = setInterval(function () {
    const element = document.querySelector(selector);
    if (element) {
      clearInterval(interval);
      callback(element);
    }
  }, 500);
}

const volumePercentHolder = document.createElement("div");
volumePercentHolder.className = "volume-percentage";

const messageHolder = document.createElement("div");
messageHolder.className = "message";
messageHolder.textContent = "Click anywhere to control volume";

const settingsMessageHolder = document.createElement("div");
settingsMessageHolder.className = "settings-message";
settingsMessageHolder.innerHTML = `
  <div class="settings-message-header">
    <h1>KickScroll</h1>
    <button class="settings-message-close">×</button>
  </div>
  <div class="settings-message-content">
    <p>New Feature: You can now customize volume control settings!</p>
    <p class="settings-message-action">Click the extension icon to access settings</p>
  </div>
`;

// Update the click handler to target the close button within the message
settingsMessageHolder
  .querySelector(".settings-message-close")
  .addEventListener("click", () => {
    settingsMessageHolder.style.opacity = "0";
    setTimeout(() => {
      if (settingsMessageHolder.parentNode) {
        settingsMessageHolder.parentNode.removeChild(settingsMessageHolder);
      }
    }, 500);
    chrome.storage.local.set({ hasShownSettingsMessage: true });
  });

function setVolumeSliderPosition(videoElement) {
  const volumeSlider = document.querySelector('[aria-label="Volume"]');
  const volumeTrack = document.querySelector(
    '[data-orientation="horizontal"].bg-white'
  );
  if (volumeSlider && volumeTrack) {
    const currentVolume = videoElement.volume;
    const volumePercentage = currentVolume * 100;
    volumeSlider.parentNode.style.left = `${volumePercentage - 5}%`;
    volumeSlider.setAttribute("aria-valuenow", volumePercentage);
    // Update the track to reflect the volume level visually
    volumeTrack.style.right = `${100 - volumePercentage}%`;
  }
}

function showVolumeSlider() {
  const volumeContainer = document.querySelector(
    ".betterhover\\:group-hover\\/volume\\:flex"
  );
  if (volumeContainer) {
    volumeContainer.style.display = "flex";
  }
}

let settings = {
  mouseButton: "right",
  showPercentage: true,
};

// Function to initialize volume control for a video element
function initializeVolumeControl(videoElement) {
  const videoHolder = document.getElementById("injected-channel-player");
  if (!videoHolder) return; // Exit if video holder not found

  let isButtonDown = false;
  let isScrolling = false;
  let wasScrolling = false;
  let volPercent;
  let intervalId;
  let hasInteracted = false; // Add this flag to track interaction

  // Add interaction listener to document
  document.addEventListener(
    "click",
    function () {
      hasInteracted = true;
    },
    { once: true }
  );

  function isTargetButtonPressed(event) {
    if (settings.mouseButton === "none") return true;
    if (settings.mouseButton === "right") return event.button === 2;
    if (settings.mouseButton === "left") return event.button === 0;
    if (settings.mouseButton === "middle") return event.button === 1;
    return false;
  }

  videoElement.addEventListener("mousedown", function (event) {
    wasScrolling = false;
    if (isTargetButtonPressed(event)) {
      isButtonDown = true;
    }
  });

  videoElement.addEventListener("contextmenu", function (event) {
    if (wasScrolling && settings.mouseButton === "right") {
      event.preventDefault();
    }
  });

  videoElement.addEventListener("mouseup", function (event) {
    if (isTargetButtonPressed(event)) {
      isButtonDown = false;
    }
  });

  videoElement.addEventListener("wheel", function (event) {
    isScrolling = true;
    wasScrolling = true;
    if (settings.mouseButton === "none" || isButtonDown) {
      event.preventDefault();

      // Only show message if user hasn't interacted and video is muted
      if (
        settings.mouseButton === "none" &&
        videoElement.muted &&
        !hasInteracted
      ) {
        messageHolder.style.opacity = "1";
        if (!messageHolder.parentNode) {
          videoHolder.appendChild(messageHolder);
        }
        setTimeout(() => {
          messageHolder.style.opacity = "0";
        }, 2000);
        return;
      }

      // Hardcoded volume step to 5%
      const volumeStep = 0.025;

      // Adjust the volume based on the scroll direction using the correct step size
      if (event.deltaY < 0) {
        if (videoElement.muted) {
          videoElement.muted = false;
        }
        videoElement.volume = Math.min(1, videoElement.volume + volumeStep);
      } else {
        videoElement.volume = Math.max(0, videoElement.volume - volumeStep);
        if (videoElement.volume === 0) {
          videoElement.muted = true;
        }
      }

      if (settings.showPercentage) {
        volumePercentHolder.style.opacity = "1";
        // Clear any existing interval before setting a new one
        clearInterval(intervalId);
        volPercent = Math.round(videoElement.volume * 100);
        volumePercentHolder.textContent = `${volPercent}%`;
        // Set a new interval
        intervalId = setInterval(() => {
          volumePercentHolder.style.opacity = "0";
        }, 1000);
        if (!volumePercentHolder.parentNode) {
          videoHolder.appendChild(volumePercentHolder);
        }
      }

      // Update the volume slider position
      setVolumeSliderPosition(videoElement);
      showVolumeSlider();
    }
  });

  // Set up a MutationObserver to watch for the controls becoming visible
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList" || mutation.type === "attributes") {
        const controls = document.querySelector(".z-controls.bottom-0");
        if (controls && window.getComputedStyle(controls).display !== "none") {
          showVolumeSlider();
          setVolumeSliderPosition(videoElement);
          break;
        }
      }
    }
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });

  // Also set the volume slider position periodically
  setInterval(() => setVolumeSliderPosition(videoElement), 1000);
}

// Split the storage gets - settings in sync, message state in local
chrome.storage.sync.get(
  {
    mouseButton: "right",
    showPercentage: true,
  },
  (loadedSettings) => {
    settings = loadedSettings;
    const videoElement = document.querySelector("#video-player");
    if (videoElement) {
      initializeVolumeControl(videoElement);

      // Check message state in local storage
      chrome.storage.local.get(
        { hasShownSettingsMessage: false },
        (messageState) => {
          if (!messageState.hasShownSettingsMessage) {
            const videoHolder = document.getElementById(
              "injected-channel-player"
            );
            if (videoHolder) {
              videoHolder.appendChild(settingsMessageHolder);
              settingsMessageHolder.style.opacity = "1";
            }
          }
        }
      );
    }
  }
);

// Listen for settings changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SETTINGS_UPDATED") {
    settings = message.settings;
    // Re-initialize for any existing video player
    const videoElement = document.querySelector("#video-player");
    if (videoElement) {
      initializeVolumeControl(videoElement);
    }
  }
});

// Watch for video player being added to the page
waitForElement("#video-player", initializeVolumeControl);
