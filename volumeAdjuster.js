function waitForElement(selector, callback) {
  const interval = setInterval(function () {
    const element = document.querySelector(selector);

    if (element) {
      clearInterval(interval);
      callback(element);
    }
  }, 100);
}
const volumePercentHolder = document.createElement("div");

waitForElement(".vjs-tech", function (videoElement) {
  const videoHolder = document.getElementById("vjs_video_3");
  let isRightMouseDown = false;
  let isScrolling = false; // Flag to track scrolling during right mouse down
  let wasScrolling = false;
  let volPercent;
  let volumeSliderDiv = document.querySelector(".vjs-volume-level");
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
  volumePercentHolder.style.fontFamily = "Inter";
  volumePercentHolder.style.fontSmooth = "always";

  // Get the element with the class 'vjs-mute-control'
  const muteControlElement =
    document.getElementsByClassName("vjs-mute-control")[0];
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
    volumePercentHolder.style.opacity = 1;
    // Clear any existing interval before setting a new one
    clearInterval(intervalId);

    volPercent = Math.round(videoElement.volume * 100);
    volumePercentHolder.textContent = `${volPercent}%`;
    videoHolder.appendChild(volumePercentHolder);

    // Set a new interval
    intervalId = setInterval(() => {
      volumePercentHolder.style.opacity = 0;
    }, 1000);

    isScrolling = true;
    wasScrolling = true;

    if (volumeSliderDiv) {
      volumeSliderDiv.style.height = volPercent + "%";
    }

    if (isRightMouseDown) {
      event.preventDefault();

      // Adjust the volume based on the scroll direction
      if (event.deltaY < 0) {
        if (videoElement.muted) {
          videoElement.muted = false;
          videoElement.volume = Math.min(1, videoElement.volume + 0.05);
          muteControlElement.classList.forEach((className) => {
            // Check if the class starts with 'vjs-vol-'
            if (className.startsWith("vjs-vol-")) {
              // If yes, remove the class
              muteControlElement.classList.remove(className);
            }
          });
          muteControlElement.classList.add("vjs-vol-1");
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
    }
  });

  videoElement.addEventListener("mouseup", function () {
    isScrolling = false; // Reset the scrolling flag on mouse up
  });
});
