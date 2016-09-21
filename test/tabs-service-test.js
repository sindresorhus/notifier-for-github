import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();

const TabsService = require('../extension/src/tabs-service.js');

test.beforeEach(t => {
	t.context.service = Object.assign({}, TabsService);
});

test('#createTab calls chrome.tabs.create and returns promise', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';

	window.chrome.tabs.create = sinon.stub().yieldsAsync({id: 1, url});

	const tab = await service.createTab(url);

	t.deepEqual(tab, {id: 1, url});
});

test('#updateTab calls chrome.tabs.update and returns promise', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';

	window.chrome.tabs.update = sinon.stub().yieldsAsync({id: 1, url});

	const tab = await service.updateTab(42, {url});

	t.deepEqual(tab, {id: 1, url});
	t.true(window.chrome.tabs.update.calledWith(42, {url}));
});

test('#queryTabs calls chrome.tabs.query and returns promise', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';
	const tabs = [{id: 1, url}, {id: 2, url}];

	window.chrome.tabs.query = sinon.stub().yieldsAsync(tabs);

	const matchedTabs = await service.queryTabs(url);

	t.deepEqual(matchedTabs, tabs);
});

test('#openTab returns promise', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';

	window.chrome.permissions.contains = sinon.stub().yieldsAsync(false);

	await service.openTab(url);

	t.pass();
});

test('#openTab creates new tab if querying tabs is not allowed', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';

	window.chrome.permissions.contains = sinon.stub().yieldsAsync(false);
	service.createTab = sinon.spy();

	await service.openTab(url);

	t.true(service.createTab.calledOnce);
	t.deepEqual(service.createTab.lastCall.args, [url]);
});

test('#openTab updates with first matched tab', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';
	const firstTab = {id: 1, url};
	const tabs = [firstTab, {id: 2, url}];

	window.chrome.permissions.contains = sinon.stub().yieldsAsync(true);
	service.queryTabs = sinon.stub().returns(Promise.resolve(tabs));
	service.updateTab = sinon.spy();

	await service.openTab(url);

	t.deepEqual(service.updateTab.lastCall.args, [firstTab.id, {
		url,
		highlighted: true
	}]);
});

test('#openTab updates empty tab if provided', async t => {
	const service = t.context.service;
	const url = 'https://api.github.com/resource';
	const emptyTab = {id: 0, url: 'chrome://newtab/'};

	window.chrome.permissions.contains = sinon.stub().yieldsAsync(true);
	service.updateTab = sinon.spy();
	service.queryTabs = sinon.stub().returns(Promise.resolve([]));

	await service.openTab(url, emptyTab);

	t.deepEqual(service.updateTab.lastCall.args, [null, {
		url,
		highlighted: false
	}]);
});
