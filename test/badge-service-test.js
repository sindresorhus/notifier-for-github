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

test('#render method sets text, background and title', t => {
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

test('#renderCount method uses default badge color', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();

	const count = 42;
	const color = t.context.defaults.getBadgeDefaultColor();
	service.renderCount(count);

	t.true(service.render.calledWith(String(count), color, 'Notifier for GitHub'));
});

test('#renderCount renders empty string when notifications count is 0', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();

	const count = 0;
	const color = t.context.defaults.getBadgeDefaultColor();
	service.renderCount(count);

	t.true(service.render.calledWith('', color, 'Notifier for GitHub'));
});

test('#renderCount renders infinity ("∞") string when notifications count > 9999', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();

	const count = 10000;
	const color = t.context.defaults.getBadgeDefaultColor();
	service.renderCount(count);

	t.true(service.render.calledWith('∞', color, 'Notifier for GitHub'));
});

test('#renderError method uses error badge color', t => {
	const service = new global.window.BadgeService(t.context.defaults);
	service.render = sinon.spy();

	const color = t.context.defaults.getBadgeErrorColor();
	service.renderError({});

	t.true(service.render.calledWith('?', color, 'Unknown error'));
});
