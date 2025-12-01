# <img src="source/icon.png" width="45" align="left"> Notifier for GitHub

> Browser extension - Get notified about new GitHub notifications

Checks for new GitHub notifications every minute, shows the number of notifications you have, and shows desktop notifications as well.

## Install

[link-chrome]: https://chrome.google.com/webstore/detail/notifier-for-github/lmjdlojahmbbcodnpecnjnmlddbkjhnn 'Version published on Chrome Web Store'
[link-firefox]: https://addons.mozilla.org/en-US/firefox/addon/notifier-for-github/ 'Version published on Mozilla Add-ons'

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/chrome/chrome.svg" width="48" alt="Chrome" valign="middle">][link-chrome] [<img valign="middle" src="https://img.shields.io/chrome-web-store/v/lmjdlojahmbbcodnpecnjnmlddbkjhnn.svg?label=%20">][link-chrome] also compatible with [<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/edge/edge.svg" width="24" alt="Edge" valign="middle">][link-chrome] [<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/opera/opera.svg" width="24" alt="Opera" valign="middle">][link-chrome] [<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/brave/brave.svg" width="24" alt="Brave" valign="middle">][link-chrome]

[<img src="https://raw.githubusercontent.com/alrra/browser-logos/90fdf03c/src/firefox/firefox.svg" width="48" alt="Firefox" valign="middle">][link-firefox] [<img valign="middle" src="https://img.shields.io/amo/v/notifier-for-github.svg?label=%20">][link-firefox]

## Highlights

- [Notification count in the toolbar icon.](#notification-count)
- [Desktop notifications.](#desktop-notifications)
- [Filter notifications](#filtering-notifications) from repositories you wish to see.
- [GitHub Enterprise support.](#github-enterprise-support)
- Click the toolbar icon to go to the GitHub notifications page.
- Option to show only unread count for issues you're participating in.

*Make sure to [add a token](#github-token-setup) in the options.*

## GitHub Token Setup

The extension requires a GitHub **Classic** Personal Access Token (PAT) to access your notifications.

1. Go to [GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. Click **"Generate new token (classic)"**
3. Give it a descriptive name (e.g., "Notifier for GitHub")
4. Select the required scopes:

| Scope | Required | Purpose |
|-------|----------|---------|
| `notifications` | ✅ Yes | Read your notifications (works for both public and private repos) |
| `repo` | Optional | Enables desktop notifications for private repos to link directly to the issue/PR |

> **Note:** With only the `notifications` scope, the notification count badge works for all repos. Adding `repo` scope allows desktop notifications for private repos to open the specific issue/PR instead of the notifications home page. If you're concerned about granting full repository access, you can skip this scope.

5. Click **"Generate token"** and copy it to the extension options

### Fine-grained Tokens (Not Yet Supported)

The extension accepts fine-grained PAT format, but **they won't work yet** due to a GitHub limitation.

This extension requires access to the [`GET /notifications`](https://docs.github.com/en/rest/activity/notifications#list-notifications-for-the-authenticated-user) API endpoint, which needs an account-level **Notifications** permission. As of December 2025, GitHub's fine-grained PATs don't offer a Notifications permission—it simply doesn't exist in their permission list.

Once GitHub adds Notifications permission to fine-grained PATs, they should work with this extension. Until then, use a **Classic token**.

## Screenshots

### Notification Count

![Screenshot of extension should notification count](media/screenshot.png)

### Options

![Options page for Notifier for GitHub](media/screenshot-options.png)

## Extension Permissions

The extension requests a couple of optional permissions. It works as intended even if you disallow these. Some features work only when you grant these permissions as mentioned below.

### Tabs Permission

When you click on the extension icon, the GitHub notifications page is opened in a new tab. The `tabs` permission lets us switch to an existing notifications tab if you already have one opened instead of opening a new one each time you click it.

This permission also lets us update the notification count immediately after opening a notification. You can find both of these options under the "Tab handling" section in the extension's options page.

### Notifications Permission

If you want to receive desktop notifications, you can enable them on the extension options page. You will then be asked for the browser's `notifications` permission.

## Configuration

### Desktop Notifications

![Notification from Notifier for GitHub extension](media/screenshot-notification.png)

You can opt-in to receive desktop notifications for new notifications on GitHub. The extension checks for new notifications every minute, and displays notifications that arrived after the last check if there are any. Clicking on the notification opens it on GitHub.

### Filtering Notifications

![Filtering Notifications](media/screenshot-filter.png)

If you have [desktop notifications](#desktop-notifications) enabled as mentioned above, you can also filter which repositories you wish to receive these notifications from. You can do this by only selecting the repositories (that grouped by user/organization) in the options menu.

### GitHub Enterprise Support

By default, the extension works for the public [GitHub](https://github.com) site. For GitHub Enterprise Server, configure the extension to use your instance URL:

1. Create a token on your enterprise instance (e.g., `https://github.yourco.com/settings/tokens`)
2. In the extension options, set the **Root URL** to your instance (e.g., `https://github.yourco.com/`)
3. Enter your token and save

## Development

### Setup

```sh
npm install
```

### Testing Your Setup

To verify the extension is working, watch a busy public repository like [microsoft/vscode](https://github.com/microsoft/vscode) and wait for new activity. The extension checks for notifications every minute, and the badge will update when you have unread notifications.

### Build and Watch

Build the extension to the `distribution/` folder and watch for changes:

```sh
npm run watch
```

### Load Extension in Browser

**Chrome/Edge/Brave:**
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `distribution/` folder

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select any file in the `distribution/` folder

### Testing

Run linting and unit tests:

```sh
npm test
```

Run only unit tests:

```sh
npm run test:js
```

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [Laxman Damera](https://github.com/notlmn)

###### Former

- [Yury Solovyov](https://github.com/YurySolovyov)
