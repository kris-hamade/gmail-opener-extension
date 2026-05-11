const DEFAULT_SETTINGS = {
    setupComplete: false,
    openMode: "chooser",
    gmailAccountIndex: "0",
    accountMappings: []
};

const form = document.getElementById("settingsForm");
const status = document.getElementById("status");
const title = document.getElementById("title");
const intro = document.getElementById("intro");
const eyebrow = document.getElementById("eyebrow");
const accountIndex = document.getElementById("gmailAccountIndex");
const accountsList = document.getElementById("accountsList");
const accountsHelp = document.getElementById("accountsHelp");

function setStatus(message) {
    status.textContent = message;
}

function setModeVisibility() {
    const mode = form.elements.openMode.value;
    accountIndex.disabled = mode !== "default";
}

async function loadSettings() {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

    form.elements.openMode.value = settings.openMode;

    if (!settings.setupComplete) {
        eyebrow.textContent = "First-time setup";
        title.textContent = "Set up Gmail Opener";
        intro.textContent = "Pick how the extension should behave the first time you click the icon.";
    } else {
        eyebrow.textContent = "Extension options";
        title.textContent = "Gmail Opener Options";
        intro.textContent = "Change whether the extension opens the anchored picker popup or jumps straight to Gmail.";
    }

    setModeVisibility();
    renderAccounts(settings.accountMappings || [], settings.gmailAccountIndex);
}

function renderAccounts(accountMappings, selectedIndex) {
    accountsList.innerHTML = "";

    if (!accountMappings.length) {
        accountsList.innerHTML = '<div class="empty-state">No accounts detected yet.</div>';
        accountsHelp.textContent = "Open Gmail or the Google account chooser in another tab and this list will fill in automatically.";
        populateSelectFallback(selectedIndex);
        return;
    }

    accountsHelp.textContent = "These values were captured from Google’s account chooser or Gmail account menu.";

    accountMappings.forEach((account) => {
        const row = document.createElement("div");
        row.className = "account-row";

        const left = document.createElement("div");
        left.className = "account-index";
        left.textContent = account.index;

        const right = document.createElement("div");
        right.className = "account-details";

        const name = document.createElement("span");
        name.className = "account-name";
        name.textContent = account.name || account.source || "Google account";

        const email = document.createElement("span");
        email.className = "account-email";
        email.textContent = account.email;

        right.appendChild(name);
        right.appendChild(email);
        row.appendChild(left);
        row.appendChild(right);
        accountsList.appendChild(row);
    });
    populateSelectFromMappings(accountMappings, selectedIndex);
}

function populateSelectFromMappings(accountMappings, selectedIndex) {
    accountIndex.innerHTML = "";
    accountMappings.forEach((acct) => {
        const opt = document.createElement('option');
        opt.value = String(acct.index);
        // If a name is available, show name and email (no leading index). Otherwise, show index and email.
        if (acct.name && acct.name.trim()) {
            opt.textContent = `${acct.name} — ${acct.email}`;
        } else {
            opt.textContent = `${acct.index} — ${acct.email}`;
        }
        accountIndex.appendChild(opt);
    });

    if (selectedIndex !== undefined && selectedIndex !== null) {
        accountIndex.value = selectedIndex;
    } else if (accountMappings.length) {
        accountIndex.value = accountMappings[0].index;
    }
}

function populateSelectFallback(selectedIndex) {
    accountIndex.innerHTML = '';
    for (let i = 0; i <= 5; i++) {
        const opt = document.createElement('option');
        opt.value = String(i);
        opt.textContent = String(i);
        accountIndex.appendChild(opt);
    }

    if (selectedIndex !== undefined && selectedIndex !== null) {
        accountIndex.value = selectedIndex;
    }
}

form.addEventListener("change", setModeVisibility);

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const settings = {
        setupComplete: true,
        openMode: form.elements.openMode.value,
        gmailAccountIndex: accountIndex.value
    };

    await chrome.storage.sync.set(settings);
    setStatus("Settings saved.");
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
        return;
    }

    if (changes.accountMappings) {
        // fetch current settings to preserve selected index
        chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
            renderAccounts(changes.accountMappings.newValue || [], settings.gmailAccountIndex);
        });
    }
    if (changes.openMode || changes.gmailAccountIndex || changes.setupComplete) {
        // keep UI state in sync when other settings change
        chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
            form.elements.openMode.value = settings.openMode;
            setModeVisibility();
        });
    }
});

loadSettings();