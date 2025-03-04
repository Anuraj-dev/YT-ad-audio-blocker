// YouTube Ad Audio Blocker - Enhanced Version
// This content script detects YouTube ads and mutes them automatically

let isMutedByExtension = false;
let previousVolume = null;
let observer = null;
let checkInterval = null;
let videoElement = null;

// Wait for the page to be fully loaded
window.addEventListener("load", () => {
  console.log("YouTube Ad Audio Blocker: Page loaded");
  setTimeout(initialize, 1500); // Give YouTube player time to initialize
});

// Initialize the extension
function initialize() {
  console.log("YouTube Ad Audio Blocker initialized");

  // Find and store the video element
  findVideoElement();

  // Set up observers to detect ads
  setupAdDetection();

  // Handle page navigation in YouTube's single page app
  listenForPageChanges();
}

function findVideoElement() {
  // Try to find the video element multiple ways
  videoElement =
    document.querySelector(".html5-main-video") ||
    document.querySelector("video");

  if (videoElement) {
    console.log("Video element found");

    // Add event listener for when a new video loads
    videoElement.addEventListener("loadeddata", () => {
      console.log("Video content loaded, checking for ads");
      checkForAd();
    });
  } else {
    // If video element not found, retry after a delay
    console.log("Video element not found, will retry");
    setTimeout(findVideoElement, 1000);
  }
}

function setupAdDetection() {
  // Clear any existing detection mechanisms
  if (observer) observer.disconnect();
  if (checkInterval) clearInterval(checkInterval);

  // Watch for changes to the player container
  const playerContainer =
    document.getElementById("movie_player") ||
    document.querySelector(".html5-video-container");

  if (playerContainer) {
    observer = new MutationObserver((mutations) => {
      checkForAd();
    });

    observer.observe(playerContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "src", "style"],
    });

    // Also observe the body for ad overlays
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  // Also check periodically for ads (as a fallback)
  checkInterval = setInterval(checkForAd, 1000);

  // Initial check for an ad
  checkForAd();
}

function checkForAd() {
  // Refind video element if needed (YouTube can replace it)
  if (!videoElement || videoElement.nodeName !== "VIDEO") {
    findVideoElement();
    if (!videoElement) return;
  }

  // Multiple ways to detect ads for reliability
  const isAdPlaying =
    // Check if the player has ad-related classes
    document.querySelector(".ad-showing") !== null ||
    document.querySelector(".ytp-ad-player-overlay") !== null ||
    document.querySelector(".video-ads.ytp-ad-module") !== null ||
    // Check for specific ad indicators
    document.querySelector(".ytp-ad-text") !== null ||
    document.querySelector(".ytp-ad-skip-button") !== null ||
    document.querySelector(".ytp-ad-preview-container") !== null ||
    // Check video URL for ad indicators
    (videoElement.src && videoElement.src.includes("ads")) ||
    // Check for ad overlay
    document.querySelector(".ytp-ad-overlay-container") !== null ||
    // Check player state
    (document.querySelector("#movie_player") &&
      document.querySelector("#movie_player").classList.contains("ad-showing"));

  console.log("Ad check result:", isAdPlaying);

  if (isAdPlaying && !isMutedByExtension) {
    // Ad detected - mute the video
    muteAd();
  } else if (!isAdPlaying && isMutedByExtension) {
    // Ad ended - restore audio
    unmuteAd();
  }
}

function muteAd() {
  if (!videoElement) return;

  // Save current volume before muting
  if (!isMutedByExtension) {
    previousVolume = videoElement.volume;
    console.log("Ad detected - Muting audio");

    // Use multiple approaches to ensure muting works
    videoElement.volume = 0;
    videoElement.muted = true;

    // Also try to mute via YouTube API if available
    const playerApi = document.querySelector("#movie_player");
    if (playerApi && typeof playerApi.mute === "function") {
      try {
        playerApi.mute();
      } catch (e) {
        console.error("Could not use YouTube API to mute:", e);
      }
    }

    isMutedByExtension = true;
  }
}

function unmuteAd() {
  if (!videoElement) return;

  if (isMutedByExtension) {
    console.log("Ad finished - Restoring audio");

    // Restore previous volume
    if (previousVolume !== null) {
      videoElement.volume = previousVolume;
    }

    videoElement.muted = false;

    // Also try to unmute via YouTube API if available
    const playerApi = document.querySelector("#movie_player");
    if (playerApi && typeof playerApi.unMute === "function") {
      try {
        playerApi.unMute();
      } catch (e) {
        console.error("Could not use YouTube API to unmute:", e);
      }
    }

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

      // Reset state
      isMutedByExtension = false;
      previousVolume = null;
      videoElement = null;

      // Wait for new page to load elements
      setTimeout(() => {
        findVideoElement();
        setupAdDetection();
      }, 2000);
    }
  }, 1000);
}

// Start the extension immediately for cases where page is already loaded
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(initialize, 1000);
}

console.log("YouTube Ad Audio Blocker: Script loaded");
