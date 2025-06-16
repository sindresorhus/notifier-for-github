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

*Make sure to add a token in the options.*

## Screenshots

### Options

![Options page for Notifier for GitHub](media/screenshot-options.png)

### Notification Count

![Screenshot of extension should notification count](media/screenshot.png)
## GitHub Token Setup

### Token Types Supported

This extension requires a GitHub personal access token to function properly. You can follow instructions from GitHub to create a personal access token in your account.

**Important:** Only classic personal access tokens are currently supported. Fine-grained personal access tokens cannot be used at this time. This limitation is tracked in an [open issue](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens).

### Repository Permissions

#### For Private Repository Notifications

To receive desktop notifications for private repositories, you must create a personal access token with the `repo` scope. This requirement exists because of GitHub's current permission structure - accessing any information about private repositories requires full repository control permissions.

#### Security Considerations

If you have security concerns about granting the `repo` scope, you can skip this permission. However, be aware of the following tradeoff:

- **Without `repo` scope:** Clicking on notifications will redirect you to the general notifications homepage instead of the specific repository or issue
- **With `repo` scope:** Clicking on notifications will take you directly to the relevant repository content

The choice between security and functionality is yours based on your comfort level with the permissions required.


## Extension Permissions

The extension requests a couple of optional permissions. It works as intended even if you disallow these. Some features work only when you grant these permissions as mentioned below.

### Tabs Permission

When you click on the extension icon, the GitHub notifications page is opened in a new tab. The `tabs` permission lets us switch to an existing notifications tab if you already have one opened instead of opening a new one each time you click it.

This permission also lets us update the notification count immediately after opening a notification. You can find both of these options under the "Tab handling" section in the extension's options page.

### Notifications Permission

If you want to receive desktop notifications for public repositories, you can enable them on extension options page. You will then be asked for the `notifications` permission.

## Configuration

### Desktop Notifications

![Notification from Notifier for GitHub extension](media/screenshot-notification.png)

You can opt-in to receive desktop notifications for new notifications on GitHub. The extension checks for new notifications every minute, and displays notifications that arrived after the last check if there are any. Clicking on the notification opens it on GitHub.

### Filtering Notifications

![Filtering Notifications](media/screenshot-filter.png)

If you have [desktop notifications](#desktop-notifications) enabled as mentioned above, you can also filter which repositories you wish to receive these notifications from. You can do this by only selecting the repositories (that grouped by user/organization) in the options menu.

### GitHub Enterprise support

By default, the extension works for the public [GitHub](https://github.com) site. If the repo of your company runs GitHub on their own servers via GitHub Enterprise Server, you have to configure the extension to use the API URL. For example `https://github.yourco.com/`.

## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [Laxman Damera](https://github.com/notlmn)

###### Former

- [Yury Solovyov](https://github.com/YurySolovyov)
