// YouTube Ad Audio Blocker
// This content script detects YouTube ads and mutes them automatically

let isMutedByExtension = false;
let previousVolume = 1; // Store the user's volume setting
let observer = null;
let checkInterval = null;

// Initialize the extension
function initialize() {
  console.log("YouTube Ad Audio Blocker initialized");

  // Set up observers to detect ads
  setupAdDetection();

  // Handle page navigation in YouTube's single page app
  listenForPageChanges();
}

function setupAdDetection() {
  // Clear any existing detection mechanisms
  if (observer) observer.disconnect();
  if (checkInterval) clearInterval(checkInterval);

  // Use MutationObserver to detect DOM changes
  observer = new MutationObserver((mutations) => {
    const video = document.querySelector("video");
    if (video) {
      checkForAd();
    }
  });

  // Observe the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributeFilter: ["class", "src"],
  });

  // Also check periodically for ads (as a fallback)
  checkInterval = setInterval(checkForAd, 1000);

  // Initial check for an ad
  checkForAd();
}

function checkForAd() {
  const video = document.querySelector("video");
  if (!video) return;

  // Multiple ways to detect ads for redundancy
  const adIndicators = [
    // Check for ad label or skip button
    document.querySelector(".ytp-ad-text"),
    document.querySelector(".ytp-ad-skip-button"),
    document.querySelector(".ad-showing"),
    document.querySelector(".ytp-ad-player-overlay"),
    document.querySelector(".ytp-ad-preview-container"),
    // Check for ad info panel
    document.querySelector(".ytp-ad-preview-text"),
    document.querySelector(".ytp-ad-preview-image"),
  ];

  const isAdPlaying = adIndicators.some((indicator) => indicator !== null);

  if (isAdPlaying && !isMutedByExtension) {
    // Ad detected - mute the video
    muteAd(video);
  } else if (!isAdPlaying && isMutedByExtension) {
    // Ad ended - restore audio
    unmuteAd(video);
  }
}

function muteAd(video) {
  // Save current volume before muting
  if (!isMutedByExtension) {
    previousVolume = video.volume;
    console.log("Ad detected - Muting audio");
    video.volume = 0;
    isMutedByExtension = true;
  }
}

function unmuteAd(video) {
  if (isMutedByExtension) {
    console.log("Ad finished - Restoring audio");
    video.volume = previousVolume;
    isMutedByExtension = false;
  }
}

function listenForPageChanges() {
  // YouTube is a single-page application, so we need to detect navigation
  let lastUrl = location.href;

  // Check for URL changes
  const urlObserver = setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      console.log("Page changed, reinitializing...");

      // Wait for new page to load elements
      setTimeout(() => {
        setupAdDetection();
      }, 1500);
    }
  }, 1000);
}

// Start the extension
initialize();
