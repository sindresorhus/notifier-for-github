(root => {
	'use strict';

	class BadgeService {
		constructor(defaults) {
			this.DefaultsService = defaults;
		}

		render(text, color, title) {
			root.chrome.browserAction.setBadgeText({text});
			root.chrome.browserAction.setBadgeBackgroundColor({color});
			root.chrome.browserAction.setTitle({title});
		}

		renderCount(count) {
			const color = this.DefaultsService.getBadgeDefaultColor();
			const title = this.DefaultsService.getDefaultTitle();
			this.render(this.getCountString(count), color, title);
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
			const title = this.DefaultsService.getErrorTitle(error);
			const symbol = this.DefaultsService.getErrorSymbol(error);
			return {symbol, title};
		}
	}

	root.BadgeService = BadgeService;
})(window);
