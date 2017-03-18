import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();

const Defaults = require('../extension/src/defaults.js');
const Badge = require('../extension/src/badge.js');

test.beforeEach(() => {
	window.chrome.browserAction.setBadgeText = sinon.spy();
	window.chrome.browserAction.setBadgeBackgroundColor = sinon.spy();
	window.chrome.browserAction.setTitle = sinon.spy();
});

test('#renderCount uses default badge color', t => {
	const count = 42;
	const color = Defaults.getBadgeDefaultColor();

	Badge.renderCount(count);

	const text = String(count);
	const title = Defaults.defaultTitle;

	t.true(window.chrome.browserAction.setBadgeText.calledWith({text}));
	t.true(window.chrome.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(window.chrome.browserAction.setTitle.calledWith({title}));
});

test('#renderCount renders empty string when notifications count is 0', t => {
	const count = 0;
	const color = Defaults.getBadgeDefaultColor();

	Badge.renderCount(count);

	const text = '';
	const title = Defaults.defaultTitle;

	t.true(window.chrome.browserAction.setBadgeText.calledWith({text}));
	t.true(window.chrome.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(window.chrome.browserAction.setTitle.calledWith({title}));
});

test('#renderCount renders infinity ("∞") string when notifications count > 9999', t => {
	const count = 10000;
	const color = Defaults.getBadgeDefaultColor();

	Badge.renderCount(count);

	const text = '∞';
	const title = Defaults.defaultTitle;

	t.true(window.chrome.browserAction.setBadgeText.calledWith({text}));
	t.true(window.chrome.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(window.chrome.browserAction.setTitle.calledWith({title}));
});

test('#renderError uses error badge color', t => {
	const color = Defaults.getBadgeErrorColor();

	Badge.renderError({});

	const text = '?';
	const title = 'Unknown error';

	t.true(window.chrome.browserAction.setBadgeText.calledWith({text}));
	t.true(window.chrome.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(window.chrome.browserAction.setTitle.calledWith({title}));
});

test('#renderError uses proper messages for errors', t => {
	const messages = [
		'missing token',
		'server error',
		'data format error',
		'parse error',
		'default'
	];

	messages.forEach(message => {
		Badge.renderError({message});
		const title = window.chrome.browserAction.setTitle.lastCall.args[0].title; // 'title' arg is 1st

		t.is(title, Defaults.getErrorTitle({message}));
	});
});

test('#renderError uses proper symbols for errors', t => {
	const crossMarkSymbolMessages = [
		'missing token'
	];

	const questionSymbolMessages = [
		'server error',
		'data format error',
		'parse error',
		'default'
	];

	crossMarkSymbolMessages.forEach(message => {
		Badge.renderError({message});
		t.true(window.chrome.browserAction.setBadgeText.calledWith({text: 'X'}));
	});

	questionSymbolMessages.forEach(message => {
		Badge.renderError({message});
		t.true(window.chrome.browserAction.setBadgeText.calledWith({text: '?'}));
	});
});
