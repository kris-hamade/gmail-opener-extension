const ACCOUNT_SELECTORS = [
    '[data-item-index][data-identifier]',
    'a[data-au][data-email]'
];

let lastSignature = "";

function readName(node) {
    const nameNode = node.querySelector('.pGzURd, .Du56O, [jsname="V1ur5d"], .ZL6CDd');
    return nameNode ? nameNode.textContent.trim() : "";
}

function readEmail(node) {
    return node.getAttribute('data-identifier')
        || node.getAttribute('data-email')
        || node.querySelector('[data-identifier], [data-email]')?.getAttribute('data-identifier')
        || node.querySelector('[data-identifier], [data-email]')?.getAttribute('data-email')
        || "";
}

function readIndex(node) {
    const index = node.getAttribute('data-item-index') || node.getAttribute('data-au');
    return index === null ? "" : String(index);
}

function collectAccounts() {
    const accounts = [];
    const seenIndexes = new Set();

    ACCOUNT_SELECTORS.forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => {
            const index = readIndex(node);
            const email = readEmail(node);

            if (!index || !email || seenIndexes.has(index)) {
                return;
            }

            seenIndexes.add(index);
            accounts.push({
                index,
                email,
                name: readName(node),
                source: location.hostname.includes('accounts.google.com') ? 'account-chooser' : 'gmail-menu'
            });
        });
    });

    return accounts.sort((left, right) => Number(left.index) - Number(right.index));
}

function publishAccounts() {
    const accounts = collectAccounts();
    const signature = JSON.stringify(accounts);

    if (signature === lastSignature || accounts.length === 0) {
        return;
    }

    lastSignature = signature;

    chrome.runtime.sendMessage({
        type: 'GMAIL_ACCOUNTS_DISCOVERED',
        accounts,
        source: location.href
    }).catch(() => {
        // The background service worker can be asleep during navigation.
    });
}

const observer = new MutationObserver(() => {
    publishAccounts();
});

function start() {
    publishAccounts();
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}