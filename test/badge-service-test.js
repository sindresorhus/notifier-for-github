import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();

const DefaultsService = require('../extension/src/defaults-service.js');
const BadgeService = require('../extension/src/badge-service.js');

test('#render sets text, background and title', t => {
	const service = BadgeService;
	const text = '0';
	const color = [0, 0, 0, 255];
	const title = 'title';

	window.chrome.browserAction.setBadgeText = sinon.spy();
	window.chrome.browserAction.setBadgeBackgroundColor = sinon.spy();
	window.chrome.browserAction.setTitle = sinon.spy();

	service.render(text, color, title);

	t.true(window.chrome.browserAction.setBadgeText.calledWith({text}));
	t.true(window.chrome.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(window.chrome.browserAction.setTitle.calledWith({title}));
});

test('#renderCount uses default badge color', t => {
	const service = BadgeService;
	const count = 42;
	const color = DefaultsService.getBadgeDefaultColor();

	service.render = sinon.spy();
	service.renderCount(count);

	t.true(service.render.calledWith(String(count), color, DefaultsService.getDefaultTitle()));
});

test('#renderCount renders empty string when notifications count is 0', t => {
	const service = BadgeService;
	const count = 0;
	const color = DefaultsService.getBadgeDefaultColor();

	service.render = sinon.spy();
	service.renderCount(count);

	t.true(service.render.calledWith('', color, DefaultsService.getDefaultTitle()));
});

test('#renderCount renders infinity ("∞") string when notifications count > 9999', t => {
	const service = BadgeService;
	const count = 10000;
	const color = DefaultsService.getBadgeDefaultColor();

	service.render = sinon.spy();
	service.renderCount(count);

	t.true(service.render.calledWith('∞', color, DefaultsService.getDefaultTitle()));
});

test('#renderError uses error badge color', t => {
	const service = BadgeService;
	const color = DefaultsService.getBadgeErrorColor();

	service.render = sinon.spy();
	service.renderError({});

	t.true(service.render.calledWith('?', color, 'Unknown error'));
});

test('#renderError uses proper messages for errors', t => {
	const service = BadgeService;
	const messages = [
		'missing token',
		'server error',
		'data format error',
		'parse error',
		'default'
	];

	service.render = sinon.spy();

	messages.forEach(message => {
		service.renderError({message});
		const title = service.render.lastCall.args[2]; // title arg is 3rd
		t.is(title, DefaultsService.getErrorTitle({message}));
	});
});

test('#renderError uses proper symbols for errors', t => {
	const service = BadgeService;
	const crossMarkSymbolMessages = [
		'missing token'
	];

	const questionSymbolMessages = [
		'server error',
		'data format error',
		'parse error',
		'default'
	];

	service.render = sinon.spy();

	crossMarkSymbolMessages.forEach(message => {
		service.renderError({message});
		t.true(service.render.calledWithMatch('X'));
	});

	questionSymbolMessages.forEach(message => {
		service.renderError({message});
		t.true(service.render.calledWithMatch('?'));
	});
});
