import * as defaults from './defaults';

function render(text, color, title) {
	browser.browserAction.setBadgeText({text});
	browser.browserAction.setBadgeBackgroundColor({color});
	browser.browserAction.setTitle({title});
}

function getCountString(count) {
	if (count === 0) {
		return '';
	}

	if (count > 9999) {
		return '∞';
	}

	return String(count);
}

function getErrorData(error) {
	const title = defaults.getErrorTitle(error);
	const symbol = defaults.getErrorSymbol(error);
	return {symbol, title};
}

export function renderCount(count) {
	const color = defaults.getBadgeDefaultColor();
	const title = defaults.defaultTitle;
	render(getCountString(count), color, title);
}

export function renderError(error) {
	const color = defaults.getBadgeErrorColor();
	const {symbol, title} = getErrorData(error);
	render(symbol, color, title);
}

export function renderWarning(warning) {
	const color = defaults.getBadgeWarningColor();
	const title = defaults.getWarningTitle(warning);
	const symbol = defaults.getWarningSymbol(warning);
	render(symbol, color, title);
}
