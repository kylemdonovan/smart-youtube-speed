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
  if (!video || isNaN(speed)) return;

  // Force speed through multiple methods
  video.playbackRate = speed;
  video.defaultPlaybackRate = speed;

  // Ensure speed stays set
  const forceSpeed = () => {
    if (video.playbackRate !== speed) {
      video.playbackRate = speed;
    }
  };

  // Apply speed repeatedly for first few milliseconds
  for (let i = 0; i < 5; i++) {
    setTimeout(forceSpeed, i * 50);
  }

  // Update UI elements
  requestAnimationFrame(() => {
    const speedButton = document.querySelector('.ytp-button[aria-label*="Playback speed"]');
    if (speedButton) {
      const speedText = speedButton.querySelector('.ytp-button-text');
      if (speedText) speedText.textContent = `${speed}x`;
    }

    document.querySelectorAll('.ytp-menuitem').forEach(item => {
      if (item.getAttribute('role') === 'menuitemradio' &&
          item.textContent.includes('Playback speed')) {
        const speedValue = item.querySelector('.ytp-menuitem-content');
        if (speedValue) speedValue.textContent = `${speed}x`;
      }
    });
  });
}

// Function to get and apply speed settings
async function applySpeedSettings() {
  const settings = await browser.storage.local.get(["musicPlayback", "videoSpeed"]);
  const video = document.querySelector('video');

  if (!video) return;

  const isMusic = isMusicVideo();
  const targetSpeed = isMusic && settings.musicPlayback ?
      1.0 :
      parseFloat(settings.videoSpeed || "1.0");

  setVideoSpeed(video, targetSpeed);

  // Monitor video element
  video.onratechange = () => {
    const currentSpeed = video.playbackRate;
    if (currentSpeed !== targetSpeed) {
      setVideoSpeed(video, targetSpeed);
    }
  };
}

// Initialize speed application monitors
function initialize() {
  // Monitor DOM changes for video player
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        if (document.querySelector('video')) {
          applySpeedSettings();
          break;
        }
      }
    }
  });

  // Watch for player container changes
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Apply speed on navigation events
  const events = ['yt-navigate-start', 'yt-navigate-finish', 'yt-page-data-updated'];
  events.forEach(event => {
    document.addEventListener(event, () => {
      requestAnimationFrame(applySpeedSettings);
    });
  });

  // Initial application
  applySpeedSettings();
}

// Start monitoring as early as possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Handle settings updates from popup
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "SETTINGS_UPDATED") {
    applySpeedSettings();
  }
});