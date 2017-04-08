import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();
const sandbox = sinon.sandbox.create();

const TabsService = require('../extension/src/tabs-service.js');

test.beforeEach(t => {
	t.context.service = Object.assign({}, TabsService);
	window.chrome.tabs = {create() {}, update() {}, query() {}};
	window.chrome.permissions = {contains() {}};
});

test.afterEach(() => {
	sandbox.restore();
});

test('#createTab calls chrome.tabs.create and returns promise', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';

	sandbox.stub(window.chrome.tabs, 'create').yieldsAsync({id: 1, url});

	const tab = await service.createTab(url);

	t.deepEqual(tab, {id: 1, url});
});

test('#updateTab calls chrome.tabs.update and returns promise', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';

	sandbox.stub(window.chrome.tabs, 'update').yieldsAsync({id: 1, url});

	const tab = await service.updateTab(42, {url});

	t.deepEqual(tab, {id: 1, url});
	t.true(window.chrome.tabs.update.calledWith(42, {url}));
});

test('#queryTabs calls chrome.tabs.query and returns promise', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';
	const tabs = [{id: 1, url}, {id: 2, url}];

	sandbox.stub(window.chrome.tabs, 'query').yieldsAsync(tabs);

	const matchedTabs = await service.queryTabs(url);

	t.deepEqual(matchedTabs, tabs);
});

test('#openTab returns promise', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';

	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(false);
	sandbox.stub(window.chrome.tabs, 'create').yieldsAsync();

	await service.openTab(url);

	t.pass();
});

test('#openTab creates new tab if querying tabs is not allowed', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';

	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(false);
	sandbox.stub(window.chrome.tabs, 'create').yieldsAsync();
	sandbox.spy(service, 'createTab');

	await service.openTab(url);

	t.true(service.createTab.calledOnce);
	t.true(service.createTab.calledWith(url));
});

test('#openTab updates with first matched tab', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';
	const firstTab = {id: 1, url};
	const tabs = [firstTab, {id: 2, url}];

	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);
	sandbox.stub(window.chrome.tabs, 'update').yieldsAsync();
	sandbox.stub(service, 'queryTabs').returns(Promise.resolve(tabs));
	sandbox.spy(service, 'updateTab');

	await service.openTab(url);

	t.deepEqual(service.updateTab.lastCall.args, [firstTab.id, {
		url,
		active: true
	}]);
});

test('#openTab updates empty tab if provided', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';
	const emptyTab = {id: 0, url: 'chrome://newtab/'};

	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);
	sandbox.stub(window.chrome.tabs, 'update').yieldsAsync();
	sandbox.stub(service, 'queryTabs').returns(Promise.resolve([]));
	sandbox.spy(service, 'updateTab');

	await service.openTab(url, emptyTab);

	t.true(service.updateTab.calledWith(null, {url, active: false}));
});
