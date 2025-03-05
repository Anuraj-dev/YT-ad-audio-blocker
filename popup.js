document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("toggleExt");
  chrome.storage.sync.get(["extensionEnabled"], (data) => {
    btn.textContent = data.extensionEnabled === false ? "Off" : "On";
  });
  btn.addEventListener("click", () => {
    chrome.storage.sync.get(["extensionEnabled"], (data) => {
      const newState = !data.extensionEnabled;
      chrome.storage.sync.set({ extensionEnabled: newState }, () => {
        btn.textContent = newState ? "On" : "Off";
      });
    });
  });
});
