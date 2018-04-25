const Defaults = require('./defaults.js');

const render = (text, color, title) => {
	window.chrome.browserAction.setBadgeText({text});
	window.chrome.browserAction.setBadgeBackgroundColor({color});
	window.chrome.browserAction.setTitle({title});
};

const getCountString = count => {
	if (count === 0) {
		return '';
	}

	if (count > 9999) {
		return '∞';
	}

	return String(count);
};

const getErrorData = error => {
	const title = Defaults.getErrorTitle(error);
	const symbol = Defaults.getErrorSymbol(error);
	return {symbol, title};
};

exports.renderCount = count => {
	const color = Defaults.getBadgeDefaultColor();
	const title = Defaults.defaultTitle;
	render(getCountString(count), color, title);
};

exports.renderError = error => {
	const color = Defaults.getBadgeErrorColor();
	const {symbol, title} = getErrorData(error);
	render(symbol, color, title);
};

exports.renderWarning = warning => {
	const color = Defaults.getBadgeWarningColor();
	const title = Defaults.getWarningTitle(warning);
	const symbol = Defaults.getWarningSymbol(warning);
	render(symbol, color, title);
};
