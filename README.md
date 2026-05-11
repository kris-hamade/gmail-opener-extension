# Gmail Opener

Click the extension icon once to open a setup popup. From there you can choose between:

- Selector mode: open Google's account chooser so you can pick a signed-in Gmail account.
- Default mode: open Gmail directly for a chosen account number.

After setup, clicking the extension icon will use the saved behavior immediately. To change the setting later, open the extension's Options page from Chrome's Manage Extensions screen.

When Gmail or the Google account chooser is open, the extension can also read the visible account rows from the page DOM and store the account number to email mapping automatically. That mapping is shown in Options so you can confirm which slot is which.

If picker mode is enabled, clicking the extension icon opens a small popup anchored to the button so you can choose an account and jump straight into that mailbox. Default mode skips the popup and opens the saved account directly.

## Build

Run these commands locally:

```bash
npm install
npm run build
```

The build outputs a `dist/` folder and creates `gmail-opener-extension.zip` in the repo root.
