import test from 'ava';

import './fixture/globals';
import * as defaults from '../source/lib/defaults';
import {renderCount, renderError} from '../source/lib/badge';

test.beforeEach(() => {
	browser.flush();
});

test.serial('#renderCount uses default badge color', t => {
	const count = 42;
	const color = defaults.getBadgeDefaultColor();

	renderCount(count);

	const text = String(count);
	const title = defaults.defaultTitle;

	t.true(browser.browserAction.setBadgeText.calledWith({text}));
	t.true(browser.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(browser.browserAction.setTitle.calledWith({title}));
});

test.serial('#renderCount renders empty string when notifications count is 0', t => {
	const count = 0;
	const color = defaults.getBadgeDefaultColor();

	renderCount(count);

	const text = '';
	const title = defaults.defaultTitle;

	t.true(browser.browserAction.setBadgeText.calledWith({text}));
	t.true(browser.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(browser.browserAction.setTitle.calledWith({title}));
});

test.serial('#renderCount renders infinity ("∞") string when notifications count > 9999', t => {
	const count = 10000;
	const color = defaults.getBadgeDefaultColor();

	renderCount(count);

	const text = '∞';
	const title = defaults.defaultTitle;

	t.true(browser.browserAction.setBadgeText.calledWith({text}));
	t.true(browser.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(browser.browserAction.setTitle.calledWith({title}));
});

test.serial('#renderError uses error badge color', t => {
	const color = defaults.getBadgeErrorColor();

	renderError({});

	const text = '?';
	const title = 'Unknown error';

	t.true(browser.browserAction.setBadgeText.calledWith({text}));
	t.true(browser.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(browser.browserAction.setTitle.calledWith({title}));
});

test.serial('#renderError uses proper messages for errors', t => {
	const messages = [
		'missing token',
		'server error',
		'data format error',
		'parse error',
		'default'
	];

	for (const message of messages) {
		renderError({message});
		const {title} = browser.browserAction.setTitle.lastCall.args[0]; // 'title' arg is 1st

		t.is(title, defaults.getErrorTitle({message}));
	}
});

test.serial('#renderError uses proper symbols for errors', t => {
	const crossMarkSymbolMessages = [
		'missing token'
	];

	const questionSymbolMessages = [
		'server error',
		'data format error',
		'parse error',
		'default'
	];

	for (const message of crossMarkSymbolMessages) {
		renderError({message});
		t.true(browser.browserAction.setBadgeText.calledWith({text: 'X'}));
	}

	for (const message of questionSymbolMessages) {
		renderError({message});
		t.true(browser.browserAction.setBadgeText.calledWith({text: '?'}));
	}
});
