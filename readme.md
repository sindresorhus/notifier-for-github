# Notifier for GitHub [![Build Status](https://travis-ci.org/sindresorhus/notifier-for-github.svg?branch=master)](https://travis-ci.org/sindresorhus/notifier-for-github)

[link-cws]: https://chrome.google.com/webstore/detail/notifier-for-github/lmjdlojahmbbcodnpecnjnmlddbkjhnn "Version published on Chrome Web Store"
[link-amo]: https://addons.mozilla.org/en-US/firefox/addon/nfg/ "Version published on Mozilla Add-ons"

> Browser extension - Get notified about new GitHub notifications

It checks for new GitHub notifications every minute.


## Install

- [**Chrome** extension][link-cws] [<img valign="middle" src="https://img.shields.io/chrome-web-store/v/lmjdlojahmbbcodnpecnjnmlddbkjhnn.svg?label=%20">][link-cws]
- [**Firefox** add-on][link-amo] [<img valign="middle" src="https://img.shields.io/amo/v/nfg.svg?label=%20">][link-amo]
- **Opera** extension: Use [this Opera extension](https://addons.opera.com/en/extensions/details/download-chrome-extension-9/) to install the Chrome version.


## Highlights

- Notification count in the toolbar icon
- Click the toolbar icon to go to the notifications page
- Desktop notifications
- Option to show only unread count for issues you're participating in
- GitHub Enterprise support

*Make sure to add a token in the options.*

## Screenshots

### Notification count
![](media/screenshot.png)

### Options
![](media/screenshot-options.png)


## Permissions

Both requested permissions are optional, so you can just decline if you don't want it.

#### Tabs permission

The first time you click on the extension icon, it will ask you for access to browser tabs. We need this to know if there is already an opened GitHub notifications page and switch to it if so.

#### Notifications permission

If you want to receive desktop notifications for public repositories, you can enable them on extension options page. You will then be asked for the notifications permission.

#### Repos permission

If you want to receive (useful) desktop notifications for any private repositories you have, you will be asked for the repo permission as well. This is due to GitHub's current permission scheme, as the only way we can read anything about your private repos is if we have full control over them. If you're concerned with your security in this manner please feel free to not give this permission, just be aware that if you do not enable this permission, clicking on the notification will take you to the notifications home page since we can't get any information about the repo you got the notification for.


## Desktop notifications

![](media/screenshot-notification.png)

You can opt-in to receive desktop notifications for new notifications on GitHub. The extension checks for new notifications every minute, and displays notifications that arrived after the last check if there are any. Clicking on the notification opens it on GitHub.


## Maintainers

- [Sindre Sorhus](https://github.com/sindresorhus)
- [Yury Solovyov](https://github.com/YurySolovyov)
- [Laxman Damera](https://github.com/notlmn)
