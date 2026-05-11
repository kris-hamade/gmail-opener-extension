const DEFAULT_SETTINGS = {
    setupComplete: false,
    openMode: "chooser",
    gmailAccountIndex: "0",
    accountMappings: []
};

const list = document.getElementById("list");
const status = document.getElementById("status");
const refreshButton = document.getElementById("refresh");
const openChooserButton = document.getElementById("openChooser");
const settingsBtn = document.getElementById("settingsBtn");

function setStatus(message) {
    status.textContent = message;
}

function openMailbox(index) {
    chrome.tabs.create({
        url: `https://mail.google.com/mail/u/${index}/`
    });
    window.close();
}

function renderEmpty(message) {
    list.innerHTML = `<div class="empty">${message}</div>`;
}

function renderAccounts(accounts) {
    list.innerHTML = "";

    if (!accounts.length) {
        renderEmpty("No discovered accounts yet. Open Gmail or the Google account chooser in another tab, then click Refresh.");
        return;
    }

    accounts.forEach((account) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "account";
        button.addEventListener("click", () => openMailbox(account.index));

        const index = document.createElement("div");
        index.className = "index";
        index.textContent = account.index;

        const meta = document.createElement("div");
        meta.className = "meta";

        const name = document.createElement("span");
        name.className = "name";
        name.textContent = account.name || "Google account";

        const email = document.createElement("span");
        email.className = "email";
        email.textContent = account.email;

        meta.appendChild(name);
        meta.appendChild(email);
        button.appendChild(index);
        button.appendChild(meta);
        list.appendChild(button);
    });
}

async function loadPopup() {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

    if (!settings.setupComplete) {
        document.getElementById("eyebrow").textContent = "First-time setup";
        document.getElementById("title").textContent = "Set up Gmail Opener";
        document.getElementById("intro").textContent = "Open the options page to choose picker mode or default mode.";
        list.innerHTML = "";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "account";
        button.textContent = "Open setup options";
        button.addEventListener("click", () => {
            chrome.runtime.openOptionsPage();
            window.close();
        });
        list.appendChild(button);
        openChooserButton.style.display = "none";
        refreshButton.style.display = "none";
        return;
    }

    openChooserButton.style.display = "inline-flex";
    refreshButton.style.display = "inline-flex";
    renderAccounts(settings.accountMappings || []);
}

refreshButton.addEventListener("click", async () => {
    // Open the account chooser in a background tab so the popup can stay open
    let chooserTabId = null;
    try {
        const tab = await chrome.tabs.create({ url: "https://accounts.google.com/AccountChooser?service=mail", active: false });
        chooserTabId = tab?.id;
    } catch (e) {
        // fallback: if tabs API isn't available, just refresh from storage
        const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
        renderAccounts(settings.accountMappings || []);
        setStatus("Refreshed.");
        return;
    }

    setStatus("Waiting for account discovery...");

    const onStorageChange = (changes, areaName) => {
        if (areaName !== 'sync' || !changes.accountMappings) {
            return;
        }

        const newMappings = changes.accountMappings.newValue || [];
        renderAccounts(newMappings);
        setStatus("Refreshed.");

        // cleanup
        chrome.storage.onChanged.removeListener(onStorageChange);
        if (chooserTabId) {
            try {
                chrome.tabs.remove(chooserTabId);
            } catch (e) {
                // ignore if tab already closed or permission denied
            }
        }
    };

    chrome.storage.onChanged.addListener(onStorageChange);

    // Safety timeout: stop waiting after 10s and refresh from storage
    setTimeout(async () => {
        chrome.storage.onChanged.removeListener(onStorageChange);
        const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
        renderAccounts(settings.accountMappings || []);
        setStatus("Refreshed.");
        if (chooserTabId) {
            try { chrome.tabs.remove(chooserTabId); } catch (e) {}
        }
    }, 10000);
});

openChooserButton.addEventListener("click", () => {
    chrome.tabs.create({
        url: "https://accounts.google.com/AccountChooser?service=mail"
    });
    window.close();
});

settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
    window.close();
});

loadPopup();