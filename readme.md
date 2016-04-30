# Notifier for GitHub [![Build Status](https://travis-ci.org/sindresorhus/notifier-for-github-chrome.svg?branch=master)](https://travis-ci.org/sindresorhus/notifier-for-github-chrome)

> Chrome extension - Displays your GitHub notifications unread count

It checks the GitHub Notifications API every minute.

#### Features:
* GitHub Enterprise support
* Show unread count for issues you're participating in
* Desktop notifications

Make sure to add a token in the Options page.

![](screenshot.png)
![](screenshot-webstore2.png)


## Install

- [Chrome extension](https://chrome.google.com/webstore/detail/notifier-for-github/lmjdlojahmbbcodnpecnjnmlddbkjhnn)
- [Opera add-on](https://addons.opera.com/en/extensions/details/github-notifier/)


## Permissions

Both requested permissions are optional, so you can just decline if you don't want it.

#### Tabs permission

The first time you click on the extension icon, it will ask you for access to browser tabs. We need this to know if there is already an opened GitHub notifications page and switch to it if so.

#### Notifications permission

If you want to receive desktop notifications, you can enable them on extension options page. You will then be asked for the notifications permission.

## Desktop notifications

Notifications look like simple cards with optional image and some text content in them.
You can opt-in to receive notifications to be better informed about things that
are important to you.

Notifier for GitHub checks for new notifications every minute, and if it will display notification that arrived after the last check if there are any.

If there are more than 3 new notifications, Chrome will show first 3, and queue up the rest to
show them when either first 3 disappear or closed.

Clicking on notification opens GitHub URL of the notification subject.
URL is fetched lazily on notification click, so there is no requests performed unless actually needed.

## Related

Also available on [Firefox](https://github.com/sindresorhus/notifier-for-github-firefox) and [Safari](https://github.com/sindresorhus/notifier-for-github-safari).


## Maintainers

- [@YuriSolovyov](https://github.com/YuriSolovyov) (Yury Solovyov)
- [@gcochard](https://github.com/gcochard) (Greg Cochard)
- [@fstoerkle](https://github.com/fstoerkle) (Florian Störkle)


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
