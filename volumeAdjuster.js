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
waitForElement("#video-player", function (videoElement) {
  const videoHolder = document.getElementById("injected-channel-player");
  let isRightMouseDown = false;
  let isScrolling = false;
  let wasScrolling = false;
  let volPercent;

  volumePercentHolder.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  volumePercentHolder.style.color = "white";
  volumePercentHolder.style.borderRadius = "12px";
  volumePercentHolder.style.height = "50px";
  volumePercentHolder.style.width = "80px";
  volumePercentHolder.style.lineHeight = "50px";
  volumePercentHolder.style.textAlign = "center";
  volumePercentHolder.style.position = "absolute";
  volumePercentHolder.style.top = "50%";
  volumePercentHolder.style.left = "50%";
  volumePercentHolder.style.transform = "translate(-50%, -50%)";
  volumePercentHolder.style.transition = "opacity 0.5s ease-in-out";
  volumePercentHolder.style.pointerEvents = "none";
  volumePercentHolder.style.fontSize = "1rem";
  volumePercentHolder.style.fontFamily = "__Inter_d65c78, Helvetica";
  volumePercentHolder.style.fontWeight = "600";
  volumePercentHolder.style.fontSmooth = "always";

  videoElement.addEventListener("mousedown", function (event) {
    wasScrolling = false;
    if (event.button == 2) {
      isRightMouseDown = true;
    }
  });

  videoElement.addEventListener("contextmenu", function (event) {
    if (wasScrolling) {
      event.preventDefault();
    }
  });

  videoElement.addEventListener("mouseup", function (event) {
    if (event.button == 2) {
      isRightMouseDown = false;
    }
  });

  let intervalId;
  videoElement.addEventListener("wheel", function (event) {
    isScrolling = true;
    wasScrolling = true;
    if (isRightMouseDown) {
      event.preventDefault();
      // Adjust the volume based on the scroll direction
      if (event.deltaY < 0) {
        if (videoElement.muted) {
          videoElement.muted = false;
        }
        // Increase volume, but ensure it doesn't go above 1
        videoElement.volume = Math.min(1, videoElement.volume + 0.05);
      } else {
        // Scroll down, decrease volume, but ensure it doesn't go below 0
        videoElement.volume = Math.max(0, videoElement.volume - 0.05);
        if (videoElement.volume === 0) {
          videoElement.muted = true;
        }
      }
      volumePercentHolder.style.opacity = 1;
      // Clear any existing interval before setting a new one
      clearInterval(intervalId);
      volPercent = Math.round(videoElement.volume * 100);
      volumePercentHolder.textContent = `${volPercent}%`;
      // Set a new interval
      intervalId = setInterval(() => {
        volumePercentHolder.style.opacity = 0;
      }, 1000);
      videoHolder.appendChild(volumePercentHolder);
      // Update the volume slider position
      setVolumeSliderPosition(videoElement);
      showVolumeSlider();
    }
  });

  videoElement.addEventListener("mouseup", function () {
    isScrolling = false; // Reset the scrolling flag on mouse up
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
});
