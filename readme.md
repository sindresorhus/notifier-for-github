# Notifier for GitHub

> Chrome/Opera extension - Displays your GitHub notifications unread count

[![Build Status](https://travis-ci.org/sindresorhus/notifier-for-github-chrome.svg?branch=master)](https://travis-ci.org/sindresorhus/notifier-for-github-chrome)

It checks the GitHub Notifications API every minute. Supports GitHub Enterprise and an option to only show unread count for issues you're participating in. Make sure to add a token in the Options page.

![](screenshot.png)
![](screenshot-webstore2.png)


## Install

- [Chrome extension](https://chrome.google.com/webstore/detail/notifier-for-github/lmjdlojahmbbcodnpecnjnmlddbkjhnn)
- [Opera add-on](https://addons.opera.com/en/extensions/details/github-notifier/)


## Permissions explanation

Both permissions are optional, so you can just decline if you don't want it.

#### Tabs permission
The first time you click on the extension icon, it will ask you for access to browser tabs. We need this to know if there is already an opened GitHub notifications page and switch to it if so.

#### Notifications permission
If you want to receive desktop notifications, you can enable them on extension options page, you will be asked about notifications permission.

## Related

Also available on [Firefox](https://github.com/sindresorhus/notifier-for-github-firefox) and [Safari](https://github.com/sindresorhus/notifier-for-github-safari).


## Maintainers

- [@YuriSolovyov](https://github.com/YuriSolovyov) (Yury Solovyov)
- [@gcochard](https://github.com/gcochard) (Greg Cochard)
- [@fstoerkle](https://github.com/fstoerkle) (Florian Störkle)


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
