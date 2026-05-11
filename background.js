const DEFAULT_SETTINGS = {
    setupComplete: false,
    openMode: "chooser",
    gmailAccountIndex: "0",
    accountMappings: []
};

function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(DEFAULT_SETTINGS, resolve);
    });
}

function updateActionPopup(settings) {
    chrome.action.setPopup({
        popup: settings.setupComplete && settings.openMode === "chooser" ? "popup.html" : ""
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

        updateActionPopup(settings);

        // If setup hasn't been completed yet, open Google's account chooser
        // so the content script can discover signed-in accounts automatically.
        if (!settings.setupComplete) {
            try {
                chrome.tabs.create({ url: "https://accounts.google.com/AccountChooser?service=mail", active: true });
            } catch (e) {
                // ignore failures in environments where tabs API isn't available
            }
        }
    });
});

function normalizeAccountMappings(accounts) {
    const uniqueAccounts = new Map();

    accounts.forEach((account) => {
        if (!account || account.index === undefined || !account.email) {
            return;
        }

        const index = String(account.index);
        uniqueAccounts.set(index, {
            index,
            email: account.email,
            name: account.name || "",
            source: account.source || "",
            updatedAt: new Date().toISOString()
        });
    });

    return Array.from(uniqueAccounts.values()).sort((left, right) => {
        return Number(left.index) - Number(right.index);
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== "GMAIL_ACCOUNTS_DISCOVERED") {
        return;
    }

    const accountMappings = normalizeAccountMappings(message.accounts || []);

    chrome.storage.sync.set({
        accountMappings,
        lastAccountScan: {
            source: message.source || sender.url || "",
            scannedAt: new Date().toISOString()
        }
    }, () => {
        sendResponse({
            ok: true,
            count: accountMappings.length
        });
    });

    return true;
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
        return;
    }

    if (changes.openMode || changes.setupComplete) {
        chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
            updateActionPopup(settings);
        });
    }
});

chrome.action.onClicked.addListener(async () => {
    const settings = await getSettings();

    if (!settings.setupComplete) {
        openSetupWindow();
        return;
    }

    if (settings.openMode === "chooser") {
        return;
    }

    openGmail(settings);
});
