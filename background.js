chrome.action.onClicked.addListener(function() {
    chrome.tabs.create({ url: "https://www.gmail.com" });
});
