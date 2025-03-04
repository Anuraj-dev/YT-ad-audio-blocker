// YouTube Ad Audio Blocker - Enhanced Version
// This content script detects YouTube ads and mutes them automatically

let isMutedByExtension = false;
let previousVolume = null;
let observer = null;
let checkInterval = null;
let videoElement = null;
let muteRetryCount = 0;
let adObserved = false;
const MAX_MUTE_RETRIES = 5;
let debugMode = true; // Set to false for production

// Helper function for logging
function log(message, force = false) {
  if (debugMode || force) {
    console.log(`YT Ad Blocker: ${message}`);
  }
}

// Wait for the page to be fully loaded
window.addEventListener("load", () => {
  log("Page loaded");
  setTimeout(initialize, 1500); // Give YouTube player time to initialize
});

// Initialize the extension
function initialize() {
  log("Initializing");

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
    log("Video element found");

    // Add event listener for when a new video loads
    videoElement.addEventListener("loadeddata", () => {
      log("Video content loaded, checking for ads");
      checkForAd();
    });

    // Add volume change listener to detect if our muting was overridden
    videoElement.addEventListener("volumechange", () => {
      if (
        isMutedByExtension &&
        videoElement.volume > 0 &&
        !videoElement.muted
      ) {
        log("Volume changed while ad is playing - re-muting");
        muteAd(true); // Force mute again
      }
    });
  } else {
    // If video element not found, retry after a delay
    log("Video element not found, will retry");
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
      for (const mutation of mutations) {
        // Look for specific changes that might indicate an ad
        if (
          mutation.type === "attributes" ||
          (mutation.type === "childList" && mutation.addedNodes.length > 0)
        ) {
          checkForAd();
          break;
        }
      }
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

    // Specifically observe the progress bar area for ad markers
    const progressBar = document.querySelector(".ytp-progress-bar-container");
    if (progressBar) {
      observer.observe(progressBar, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
  }

  // Check periodically for ads (as a fallback)
  checkInterval = setInterval(checkForAd, 500); // More frequent checks

  // Initial check for an ad
  checkForAd();
}

function checkForAd() {
  // Refind video element if needed (YouTube can replace it)
  if (!videoElement || videoElement.nodeName !== "VIDEO") {
    findVideoElement();
    if (!videoElement) return;
  }

  // Enhanced ad detection with more specific selectors
  const adIndicators = [
    ".ad-showing", // Player has ad-showing class
    ".ytp-ad-player-overlay", // Ad overlay is present
    ".video-ads.ytp-ad-module", // Ad module is present
    ".ytp-ad-text", // Ad text is displayed
    ".ytp-ad-skip-button", // Skip button is present
    ".ytp-ad-preview-container", // Ad preview container
    ".ytp-ad-preview-text", // Preview text for upcoming ad
    "[class*='ad-container']", // Any container with ad in class
    ".ytp-ad-overlay-container", // Ad overlay container
    ".ytp-ad-overlay-image", // Ad overlay image
    ".ytp-ad-progress-bar-container", // Ad progress bar
    ".ytp-ad-feedback-dialog-container", // Ad feedback dialog
    "[data-layer^='ad']", // Data layer with ad prefix
  ];

  const isAdPlaying =
    adIndicators.some(
      (selector) => document.querySelector(selector) !== null
    ) ||
    // Check video URL for ad indicators
    (videoElement.src && videoElement.src.includes("ads")) ||
    // Check player state
    (document.querySelector("#movie_player") &&
      document
        .querySelector("#movie_player")
        .classList.contains("ad-showing")) ||
    // Check title attributes that might contain ad information
    (document.querySelector(".ytp-title-text") &&
      document
        .querySelector(".ytp-title-text")
        .textContent.toLowerCase()
        .includes("ad")) ||
    // Check if video has an ad badge
    document.querySelector(".ytp-ad-badge") !== null;

  // Additional check: ad progress bar
  const progressMarkers = document.querySelectorAll(".ytp-ad-progress");
  if (progressMarkers.length > 0) {
    log("Ad progress markers detected");
  }

  // Check for player state changes that could indicate ads
  const playerState = getPlayerState();
  if (playerState === "ad" && !adObserved) {
    log("Player in ad state detected");
    adObserved = true;
  } else if (playerState !== "ad") {
    adObserved = false;
  }

  if (isAdPlaying || playerState === "ad") {
    log(`Ad detected (status: ${isAdPlaying}, playerState: ${playerState})`);

    // Make sure the skip button is visible and clickable if it exists
    preserveSkipButton();

    if (!isMutedByExtension) {
      muteAd();
    } else {
      // Even if we think it's muted, double check it actually is
      verifyMuted();
    }
  } else if (isMutedByExtension) {
    log("Ad ended - restoring audio");
    unmuteAd();
    muteRetryCount = 0; // Reset retry counter after unmuting
  }
}

// Get the YouTube player state if possible
function getPlayerState() {
  try {
    const player = document.querySelector("#movie_player");
    if (player && player.getAdState) {
      const adState = player.getAdState();
      return adState > 0 ? "ad" : "content";
    }

    // Alternative detection method
    if (document.querySelector(".ad-showing")) {
      return "ad";
    }
  } catch (e) {
    log(`Error getting player state: ${e.message}`);
  }
  return "unknown";
}

// Make sure skip button is preserved and working
function preserveSkipButton() {
  const skipButton =
    document.querySelector(".ytp-ad-skip-button") ||
    document.querySelector(".ytp-ad-skip-button-container");

  if (skipButton) {
    // Ensure the button is visible
    if (window.getComputedStyle(skipButton).display === "none") {
      skipButton.style.display = "block";
      log("Restored hidden skip button");
    }

    // Make sure it's clickable (not consumed by our events)
    if (!skipButton.dataset.monitored) {
      skipButton.dataset.monitored = "true";
      log("Skip button preserved");
    }
  }
}

function muteAd(force = false) {
  if (!videoElement) return;

  // Save current volume before muting (only if this is first mute attempt)
  if (!isMutedByExtension || force) {
    previousVolume = videoElement.volume;
    log(`Ad detected - Muting audio (retry: ${muteRetryCount})`);

    // Use multiple approaches to ensure muting works
    try {
      // Primary mute method
      videoElement.volume = 0;
      videoElement.muted = true;

      // Try to mute via YouTube API if available
      const playerApi = document.querySelector("#movie_player");
      if (playerApi) {
        // Try multiple API approaches
        if (typeof playerApi.mute === "function") {
          playerApi.mute();
        }
        // Some YouTube instances use setVolume instead
        if (typeof playerApi.setVolume === "function") {
          playerApi.setVolume(0);
        }
      }

      isMutedByExtension = true;

      // Verify mute was successful
      setTimeout(verifyMuted, 250);
    } catch (e) {
      log(`Error during muting: ${e.message}`, true);

      // If muting fails, retry a few times
      if (muteRetryCount < MAX_MUTE_RETRIES) {
        muteRetryCount++;
        setTimeout(() => muteAd(force), 100 * muteRetryCount);
      }
    }
  }
}

// Verify that our muting actually worked
function verifyMuted() {
  if (!videoElement || !isMutedByExtension) return;

  const isActuallyMuted = videoElement.volume === 0 || videoElement.muted;

  if (!isActuallyMuted) {
    log("Muting verification failed - retrying mute", true);
    muteAd(true); // Force mute again
  } else {
    log("Muting verified successfully");
  }
}

function unmuteAd() {
  if (!videoElement) return;

  if (isMutedByExtension) {
    log("Ad finished - Restoring audio");

    try {
      // Restore previous volume
      if (previousVolume !== null && previousVolume > 0) {
        videoElement.volume = previousVolume;
      } else {
        // Default to middle volume if no previous volume stored
        videoElement.volume = 0.5;
      }

      videoElement.muted = false;

      // Also try to unmute via YouTube API if available
      const playerApi = document.querySelector("#movie_player");
      if (playerApi) {
        if (typeof playerApi.unMute === "function") {
          playerApi.unMute();
        }
        // Some YouTube instances use setVolume instead
        if (
          typeof playerApi.setVolume === "function" &&
          previousVolume !== null
        ) {
          playerApi.setVolume(Math.floor(previousVolume * 100));
        }
      }

      isMutedByExtension = false;
    } catch (e) {
      log(`Error during unmuting: ${e.message}`, true);
    }
  }
}

function listenForPageChanges() {
  // YouTube is a single-page application, so we need to detect navigation
  let lastUrl = location.href;

  // Check for URL changes
  const urlObserver = setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      log("Page changed, reinitializing...");

      // Reset state
      isMutedByExtension = false;
      previousVolume = null;
      videoElement = null;
      muteRetryCount = 0;
      adObserved = false;

      // Wait for new page to load elements
      setTimeout(() => {
        findVideoElement();
        setupAdDetection();
      }, 1500);
    }
  }, 1000);

  // Listen for history state changes as well (which YouTube uses)
  window.addEventListener("yt-navigate-start", () => {
    log("YouTube navigation detected");
    // Reset on navigation
    isMutedByExtension = false;
    previousVolume = null;
  });
}

// Start the extension immediately for cases where page is already loaded
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(initialize, 1000);
}

log("Script loaded", true);
