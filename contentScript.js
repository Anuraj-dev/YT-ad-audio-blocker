// Simple YouTube Ad Audio Blocker
// This script mutes YouTube ads and restores audio when ads are gone

let isMuted = false;
let previousVolume = 1;
let videoElement = null;
let observer = null;
let checkInterval = null;

// Wait for the page to be fully loaded
window.addEventListener("load", () => {
  setTimeout(initialize, 1000);
});

// Initialize when page loads
function initialize() {
  // Find video element
  findVideoElement();

  // Set up ad detection
  setupAdDetection();

  // Listen for page changes (YouTube is a single-page app)
  listenForPageChanges();
}

// Find the YouTube video player element
function findVideoElement() {
  videoElement = document.querySelector("video");

  if (videoElement) {
    // Listen for new video loads
    videoElement.addEventListener("loadeddata", checkForAd);
  } else {
    // Retry if video element not found
    setTimeout(findVideoElement, 1000);
  }
}

// Set up mutation observer to detect changes that might indicate ads
function setupAdDetection() {
  // Clear any existing observers/intervals
  if (observer) observer.disconnect();
  if (checkInterval) clearInterval(checkInterval);

  // Create observer for DOM changes
  observer = new MutationObserver(() => checkForAd());

  // Observe the player area
  const playerContainer =
    document.querySelector("#movie_player") ||
    document.querySelector(".html5-video-container");
  if (playerContainer) {
    observer.observe(playerContainer, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Also observe the body for ad-related elements
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  // Check periodically for ads as a fallback
  checkInterval = setInterval(checkForAd, 500);

  // Initial check
  checkForAd();
}

// Check if an ad is currently playing
function checkForAd() {
  if (!videoElement) {
    findVideoElement();
    return;
  }

  // More precise ad detection
  const isPlayerInAdMode =
    document.querySelector("#movie_player") &&
    document.querySelector("#movie_player").classList.contains("ad-showing");

  const skipButton =
    document.querySelector(".ytp-ad-skip-button") ||
    document.querySelector(".ytp-ad-skip-button-container");

  const adOverlay = document.querySelector(".ytp-ad-player-overlay");

  // Make sure we only detect visible ad elements
  const isVisibleAdOverlay =
    adOverlay &&
    window.getComputedStyle(adOverlay).display !== "none" &&
    window.getComputedStyle(adOverlay).visibility !== "hidden";

  const isAdPlaying =
    isPlayerInAdMode ||
    (skipButton && window.getComputedStyle(skipButton).display !== "none") ||
    isVisibleAdOverlay;

  if (isAdPlaying) {
    // Only log when state changes to avoid console spam
    if (!isMuted) {
      console.log("Ad detected - muting audio");
      muteAudio();
    }
  } else if (isMuted) {
    console.log("Ad ended - restoring audio");
    restoreAudio();
  }
}

// Mute audio during ads
function muteAudio() {
  if (!videoElement) return;

  // Save current volume before muting
  previousVolume = videoElement.volume;

  // Mute using multiple approaches for reliability
  try {
    // Basic method - set volume to 0
    videoElement.volume = 0;
    videoElement.muted = true;

    // Also try using YouTube's API
    const player = document.querySelector("#movie_player");
    if (player && typeof player.mute === "function") {
      player.mute();
    }

    isMuted = true;
  } catch (e) {
    console.error("Error muting ad:", e);
  }
}

// Restore audio when ad ends
function restoreAudio() {
  if (!videoElement) return;

  try {
    // Restore previous volume
    videoElement.volume = previousVolume > 0 ? previousVolume : 0.5;
    videoElement.muted = false;

    // Also try using YouTube's API
    const player = document.querySelector("#movie_player");
    if (player && typeof player.unMute === "function") {
      player.unMute();
      if (typeof player.setVolume === "function" && previousVolume > 0) {
        player.setVolume(Math.floor(previousVolume * 100));
      }
    }

    isMuted = false;
  } catch (e) {
    console.error("Error restoring audio:", e);
  }
}

// Handle YouTube's single-page app navigation
function listenForPageChanges() {
  let lastUrl = location.href;

  // Check for URL changes
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;

      // Reset state
      isMuted = false;
      videoElement = null;

      // Reinitialize on page change
      setTimeout(() => {
        findVideoElement();
        setupAdDetection();
      }, 1000);
    }
  }, 1000);

  // Listen for YouTube's navigation events
  window.addEventListener("yt-navigate-start", () => {
    isMuted = false;
    previousVolume = 1;
  });
}

// Start immediately if page is already loaded
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(initialize, 500);
}
