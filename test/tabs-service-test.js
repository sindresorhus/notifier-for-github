import test from 'ava';

import * as tabs from '../source/lib/tabs-service';

test.beforeEach(t => {
	t.context.service = Object.assign({}, tabs);

	t.context.defaultOptions = {
		options: {
			newTabAlways: false
		}
	};

	browser.storage.sync.get.callsFake((key, cb) => {
		cb(t.context.defaultOptions);
	});
});

test.serial('#createTab calls browser.tabs.create and returns promise', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';

	browser.tabs.create.resolves({id: 1, url});

	const tab = await service.createTab(url);

	t.deepEqual(tab, {id: 1, url});
});

test.serial('#updateTab calls browser.tabs.update and returns promise', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';

	browser.tabs.update.resolves({id: 1, url});

	const tab = await service.updateTab(42, {url});

	t.deepEqual(tab, {id: 1, url});
	t.deepEqual(browser.tabs.update.lastCall.args, [42, {url}]);
});

test.serial('#queryTabs calls browser.tabs.query and returns promise', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';
	const tabs = [{id: 1, url}, {id: 2, url}];

	browser.tabs.query.resolves(tabs);

	const matchedTabs = await service.queryTabs(url);

	t.deepEqual(matchedTabs, tabs);
});

test.serial('#openTab updates with first matched tab', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';
	const firstTab = {id: 1, url};
	const tabs = [firstTab, {id: 2, url}];

	browser.permissions.contains.resolves(true);
	browser.tabs.query.resolves(tabs);

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

	browser.permissions.contains.resolves(true);
	browser.tabs.query.resolves([]);

	await service.openTab(url, emptyTab);

	t.deepEqual(browser.tabs.update.lastCall.args, [null, {
		url,
		active: false
	}]);
});

test.serial('#openTab opens new tab even if matching tab exists', async t => {
	const {service} = t.context;
	const url = 'https://api.github.com/resource';
	const tabs = [{id: 1, url}];

	browser.permissions.contains.resolves(true);
	browser.tabs.query.resolves(tabs);

	t.context.defaultOptions = {
		options: {
			newTabAlways: true
		}
	};

	await service.openTab(url);

	t.deepEqual(browser.tabs.update.lastCall.args, [null, {
		url,
		active: false
	}]);
});
