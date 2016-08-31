const DefaultsService = require('./defaults-service.js');

const BadgeService = {
	render(text, color, title) {
		window.chrome.browserAction.setBadgeText({text});
		window.chrome.browserAction.setBadgeBackgroundColor({color});
		window.chrome.browserAction.setTitle({title});
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

module.exports = BadgeService;
