const DEFAULT_SETTINGS = {
    setupComplete: false,
    openMode: "chooser",
    gmailAccountIndex: "0"
};

function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_SETTINGS, resolve);
    });
}

function openSetupWindow() {
    chrome.windows.create({
        url: chrome.runtime.getURL("options.html?setup=1"),
        type: "popup",
        width: 520,
        height: 700
    });
}

function openGmail(settings) {
    const url = settings.openMode === "default"
        ? `https://mail.google.com/mail/u/${settings.gmailAccountIndex}/`
        : "https://accounts.google.com/AccountChooser?service=mail";

    chrome.tabs.create({ url });
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        if (settings.setupComplete === undefined) {
            chrome.storage.sync.set(DEFAULT_SETTINGS);
        }
    });
});

chrome.action.onClicked.addListener(async () => {
    const settings = await getSettings();

    if (!settings.setupComplete) {
        openSetupWindow();
        return;
    }

    openGmail(settings);
});
