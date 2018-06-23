import test from 'ava';
import sinon from 'sinon';

import * as tabs from '../source/lib/tabs-service';

test.beforeEach(t => {
	t.context.service = Object.assign({}, tabs);
});

test.serial('#createTab calls browser.tabs.create and returns promise', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';

	browser.tabs.create = sinon.stub().resolves({id: 1, url});

	const tab = await service.createTab(url);

	t.deepEqual(tab, {id: 1, url});
});

test.serial('#updateTab calls browser.tabs.update and returns promise', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';

	browser.tabs.update = sinon.stub().resolves({id: 1, url});

	const tab = await service.updateTab(42, {url});

	t.deepEqual(tab, {id: 1, url});
	t.deepEqual(browser.tabs.update.lastCall.args, [42, {url}]);
});

test.serial('#queryTabs calls browser.tabs.query and returns promise', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';
	const tabs = [{id: 1, url}, {id: 2, url}];

	browser.tabs.query = sinon.stub().resolves(tabs);

	const matchedTabs = await service.queryTabs(url);

	t.deepEqual(matchedTabs, tabs);
});

test.serial('#openTab updates with first matched tab', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';
	const firstTab = {id: 1, url};
	const tabs = [firstTab, {id: 2, url}];

	browser.permissions.contains = sinon.stub().yieldsAsync(true);
	browser.tabs.query = sinon.stub().resolves(tabs);
	browser.tabs.update = sinon.spy();

	await service.openTab(url);

	t.deepEqual(browser.tabs.update.lastCall.args, [firstTab.id, {
		url,
		active: true
	}]);
});

test.serial('#openTab updates empty tab if provided', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';
	const emptyTab = {id: 0, url: 'chrome://newtab/'};

	browser.permissions.contains = sinon.stub().yieldsAsync(true);
	browser.tabs.update = sinon.spy();
	browser.tabs.query = sinon.stub().resolves([]);

	await service.openTab(url, emptyTab);

	t.deepEqual(browser.tabs.update.lastCall.args, [null, {
		url,
		active: false
	}]);
});
