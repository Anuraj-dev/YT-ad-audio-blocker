document.addEventListener("DOMContentLoaded", () => {
  const toggleInput = document.getElementById("toggleExt");
  const toggleStatus = document.getElementById("toggleStatus");
  chrome.storage.sync.get(["extensionEnabled"], (data) => {
    if (data.extensionEnabled === undefined) {
      chrome.storage.sync.set({ extensionEnabled: true });
      toggleInput.checked = true;
      toggleStatus.textContent = "ON";
    } else {
      toggleInput.checked = data.extensionEnabled;
      toggleStatus.textContent = data.extensionEnabled ? "ON" : "OFF";
    }
  });
  toggleInput.addEventListener("change", () => {
    const newState = toggleInput.checked;
    toggleStatus.textContent = newState ? "ON" : "OFF";
    chrome.storage.sync.set({ extensionEnabled: newState });
  });
});
