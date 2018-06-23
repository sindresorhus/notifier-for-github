import * as defaults from './defaults';

const render = (text, color, title) => {
	browser.browserAction.setBadgeText({text});
	browser.browserAction.setBadgeBackgroundColor({color});
	browser.browserAction.setTitle({title});
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
	const title = defaults.getErrorTitle(error);
	const symbol = defaults.getErrorSymbol(error);
	return {symbol, title};
};

export const renderCount = count => {
	const color = defaults.getBadgeDefaultColor();
	const title = defaults.defaultTitle;
	render(getCountString(count), color, title);
};

export const renderError = error => {
	const color = defaults.getBadgeErrorColor();
	const {symbol, title} = getErrorData(error);
	render(symbol, color, title);
};

export const renderWarning = warning => {
	const color = defaults.getBadgeWarningColor();
	const title = defaults.getWarningTitle(warning);
	const symbol = defaults.getWarningSymbol(warning);
	render(symbol, color, title);
};
