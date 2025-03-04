/**
 * YouTube Ad Debugger
 * This is a utility script to help debug ad detection issues
 */

// Create a small floating panel to display ad detection status
function createDebugPanel() {
  const panel = document.createElement("div");
  panel.id = "yt-ad-debug-panel";
  panel.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    z-index: 9999;
    font-size: 12px;
    width: 200px;
    max-height: 300px;
    overflow-y: auto;
    font-family: monospace;
  `;

  const header = document.createElement("div");
  header.textContent = "YT Ad Blocker Debug";
  header.style.fontWeight = "bold";
  header.style.borderBottom = "1px solid #666";
  header.style.paddingBottom = "5px";
  header.style.marginBottom = "5px";

  const status = document.createElement("div");
  status.id = "yt-ad-status";

  const adIndicators = document.createElement("div");
  adIndicators.id = "yt-ad-indicators";

  const muteStatus = document.createElement("div");
  muteStatus.id = "yt-mute-status";

  panel.appendChild(header);
  panel.appendChild(status);
  panel.appendChild(muteStatus);
  panel.appendChild(adIndicators);

  document.body.appendChild(panel);

  return panel;
}

// Update the debug panel with current status
function updateDebugPanel(isAd, isMuted, indicators) {
  const statusEl = document.getElementById("yt-ad-status");
  const muteEl = document.getElementById("yt-mute-status");
  const indEl = document.getElementById("yt-ad-indicators");

  if (statusEl) {
    statusEl.textContent = `Ad Playing: ${isAd ? "YES" : "NO"}`;
    statusEl.style.color = isAd ? "#ff4444" : "#44ff44";
  }

  if (muteEl) {
    muteEl.textContent = `Audio Muted: ${isMuted ? "YES" : "NO"}`;
    muteEl.style.color =
      (isAd && isMuted) || (!isAd && !isMuted) ? "#44ff44" : "#ff4444";
  }

  if (indEl && indicators) {
    indEl.innerHTML =
      '<div style="margin-top:5px;border-top:1px solid #666;padding-top:5px;">Ad Indicators:</div>';
    for (const [key, found] of Object.entries(indicators)) {
      const line = document.createElement("div");
      line.textContent = `${key}: ${found ? "✓" : "✗"}`;
      line.style.color = found ? "#44ff44" : "#aaaaaa";
      indEl.appendChild(line);
    }
  }
}

// Function to toggle the debug panel
function toggleDebugPanel() {
  const existingPanel = document.getElementById("yt-ad-debug-panel");

  if (existingPanel) {
    existingPanel.remove();
  } else {
    createDebugPanel();
  }
}

// Listen for keyboard shortcut to show/hide debug panel (Ctrl+Shift+A)
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === "A") {
    toggleDebugPanel();
    e.preventDefault();
  }
});

// Export functions for content script to use
window.adDebugger = {
  toggleDebugPanel,
  updateDebugPanel,
};

console.log(
  "YouTube Ad Audio Blocker: Debugger loaded - Press Ctrl+Shift+A to toggle debug panel"
);
