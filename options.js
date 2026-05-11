const DEFAULT_SETTINGS = {
    setupComplete: false,
    openMode: "chooser",
    gmailAccountIndex: "0"
};

const form = document.getElementById("settingsForm");
const status = document.getElementById("status");
const title = document.getElementById("title");
const intro = document.getElementById("intro");
const eyebrow = document.getElementById("eyebrow");
const accountIndex = document.getElementById("gmailAccountIndex");

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
    accountIndex.value = settings.gmailAccountIndex;

    if (!settings.setupComplete) {
        eyebrow.textContent = "First-time setup";
        title.textContent = "Set up Gmail Opener";
        intro.textContent = "Pick how the extension should behave the first time you click the icon.";
    } else {
        eyebrow.textContent = "Extension options";
        title.textContent = "Gmail Opener Options";
        intro.textContent = "Change the default click behavior for Gmail Opener.";
    }

    setModeVisibility();
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

loadSettings();