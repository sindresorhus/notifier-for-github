import test from 'ava';
import sinon from 'sinon';
import utils from './utils';

global.window = utils.setupWindow();
require('../extension/src/defaults-service.js');
require('../extension/src/badge-service.js');

test.beforeEach(t => {
	t.context.defaults = new global.window.DefaultsService();
});

test('installs BadgeService constructor', t => {
	t.is(typeof global.window.BadgeService, 'function');
});

test('BadgeService constructor sets DefaultsService', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	t.true(service.DefaultsService instanceof global.window.DefaultsService);
});

test('#render sets text, background and title', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	global.window.chrome.browserAction.setBadgeText = sinon.spy();
	global.window.chrome.browserAction.setBadgeBackgroundColor = sinon.spy();
	global.window.chrome.browserAction.setTitle = sinon.spy();

	const text = '0';
	const color = [0, 0, 0, 255];
	const title = 'title';

	service.render(text, color, title);
	t.true(global.window.chrome.browserAction.setBadgeText.calledWith({text}));
	t.true(global.window.chrome.browserAction.setBadgeBackgroundColor.calledWith({color}));
	t.true(global.window.chrome.browserAction.setTitle.calledWith({title}));
});

test('#renderCount uses default badge color', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();

	const count = 42;
	const color = t.context.defaults.getBadgeDefaultColor();
	service.renderCount(count);

	t.true(service.render.calledWith(String(count), color, t.context.defaults.getDefaultTitle()));
});

test('#renderCount renders empty string when notifications count is 0', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();

	const count = 0;
	const color = t.context.defaults.getBadgeDefaultColor();
	service.renderCount(count);

	t.true(service.render.calledWith('', color, t.context.defaults.getDefaultTitle()));
});

test('#renderCount renders infinity ("∞") string when notifications count > 9999', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();

	const count = 10000;
	const color = t.context.defaults.getBadgeDefaultColor();
	service.renderCount(count);

	t.true(service.render.calledWith('∞', color, t.context.defaults.getDefaultTitle()));
});

test('#renderError uses error badge color', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();

	const color = t.context.defaults.getBadgeErrorColor();
	service.renderError({});

	t.true(service.render.calledWith('?', color, 'Unknown error'));
});

test('#renderError uses proper messages for errors', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();
	const messages = [
		'missing token',
		'server error',
		'data format error',
		'parse error',
		'default'
	];

	messages.forEach(message => {
		service.renderError({message});
		const title = service.render.lastCall.args[2]; // title arg is 3rd
		t.is(title, t.context.defaults.getErrorTitle({message}));
	});
});

test('#renderError uses proper symbols for errors', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();

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
		service.renderError({message});
		t.true(service.render.calledWithMatch('X'));
	});

	questionSymbolMessages.forEach(message => {
		service.renderError({message});
		t.true(service.render.calledWithMatch('?'));
	});
});
