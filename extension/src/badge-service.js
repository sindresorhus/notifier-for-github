(root => {
	'use strict';

	class BadgeService {
		constructor(defaults) {
			this.DefaultsService = defaults;
		}

		render(count, color, title) {
			chrome.browserAction.setBadgeText({count});
			chrome.browserAction.setBadgeBackgroundColor({color});
			chrome.browserAction.setTitle({title});
		}

		renderCount(count) {
			const color = this.DefaultsService.getBadgeDefaultColor();
			const title = 'Notifier for GitHub';
			this.render(count, color, title);
		}

		renderError(error) {
			const color = this.DefaultsService.getBadgeErrorColor();
			const {symbol, title} = this.getErrorData(error);
			this.render(symbol, color, title);
		}

		getCountString(count) {
			if (count === 0) {
				return '';
			} else if (count > 9999) {
				return '∞';
			}
			return String(count);
		}

		getErrorData(error) {
			let symbol = '?';
			let title;

			switch (error.message) {
				case 'missing token':
					title = 'Missing access token, please create one and enter it in Options';
					symbol = 'X';
					break;
				case 'server error':
					title = 'You have to be connected to the Internet';
					break;
				case 'data format error':
				case 'parse error':
					title = 'Unable to find count';
					break;
				default:
					title = 'Unknown error';
					break;
			}
			return {symbol, title};
		}
	}

	root.BadgeService = BadgeService;
})(window);
