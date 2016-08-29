'use strict';

import DefaultsService from './defaults-service';

const BadgeService = {
	render(text, color, title) {
		chrome.browserAction.setBadgeText({text});
		chrome.browserAction.setBadgeBackgroundColor({color});
		chrome.browserAction.setTitle({title});
	},

	renderCount(count) {
		const color = DefaultsService.getBadgeDefaultColor();
		const title = DefaultsService.getDefaultTitle();
		this.render(this.getCountString(count), color, title);
	},

	renderError(error) {
		const color = DefaultsService.getBadgeErrorColor();
		const {symbol, title} = this.getErrorData(error);
		this.render(symbol, color, title);
	},

	getCountString(count) {
		if (count === 0) {
			return '';
		} else if (count > 9999) {
			return '∞';
		}
		return String(count);
	},

	getErrorData(error) {
		const title = DefaultsService.getErrorTitle(error);
		const symbol = DefaultsService.getErrorSymbol(error);
		return {symbol, title};
	}
};

export default BadgeService;
