// Function to check if current video is a music video
function isMusicVideo() {
  // Check for Music category indicator
  const musicCategory = document.querySelector('yt-formatted-string.ytd-video-primary-info-renderer a[href*="/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ"]');
  if (musicCategory) return true;

  // Check for "Music" in video metadata
  const categoryElements = Array.from(document.querySelectorAll('yt-formatted-string'));
  const musicMetadata = categoryElements.some(el =>
      el.textContent.includes('Music') &&
      (el.closest('#title') || el.closest('.ytd-rich-list-header-renderer'))
  );
  if (musicMetadata) return true;

  return false;
}

// Function to set video speed and update UI
function setVideoSpeed(video, speed) {
  if (video && !isNaN(speed)) {
    // Set the actual playback speed
    video.playbackRate = speed;

    // Find the speed button and update it
    const speedButton = document.querySelector('.ytp-button[aria-label*="Playback speed"]');
    if (speedButton) {
      const speedText = speedButton.querySelector('.ytp-button-text');
      if (speedText) {
        speedText.textContent = `${speed}x`;
      }
    }

    // Update speed in settings menu if it's open
    const menuItems = document.querySelectorAll('.ytp-menuitem');
    menuItems.forEach(item => {
      if (item.getAttribute('role') === 'menuitemradio' &&
          item.textContent.includes('Playback speed')) {
        const speedValue = item.querySelector('.ytp-menuitem-content');
        if (speedValue) {
          speedValue.textContent = `${speed}x`;
        }
      }
    });

    console.log(`Speed set to: ${speed}x`);
  }
}

// Function to handle video element
function handleVideo(settings) {
  const video = document.querySelector("video");
  if (video) {
    const isMusic = isMusicVideo();
    const targetSpeed = isMusic && settings.musicPlayback ?
        1.0 :
        parseFloat(settings.videoSpeed);

    // Set initial speed
    setVideoSpeed(video, targetSpeed);

    // Monitor for YouTube trying to change the speed
    video.onratechange = function(e) {
      const currentSpeed = isMusic && settings.musicPlayback ?
          1.0 :
          parseFloat(settings.videoSpeed);

      if (video.playbackRate !== currentSpeed) {
        setVideoSpeed(video, currentSpeed);
      }
    };
  }
}

// Initialize and monitor for changes
function initialize() {
  browser.storage.local.get(["musicPlayback", "videoSpeed"]).then((settings) => {
    const defaultSettings = {
      musicPlayback: settings.musicPlayback ?? false,
      videoSpeed: settings.videoSpeed ?? "1.0"
    };

    // Create observer for YouTube's dynamic content
    const observer = new MutationObserver(() => {
      handleVideo(defaultSettings);
    });

    // Start observing
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    // Initial application
    handleVideo(defaultSettings);
  });
}

// Listen for settings updates from popup
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "SETTINGS_UPDATED") {
    handleVideo(message.settings);
  }
});

// Start on page load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}