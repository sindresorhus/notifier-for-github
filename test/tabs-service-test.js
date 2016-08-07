import test from 'ava';
import sinon from 'sinon';
import utils from './utils';

global.window = utils.setupWindow();

require('../extension/src/persistence-service.js');
require('../extension/src/permissions-service.js');
require('../extension/src/tabs-service.js');

test.beforeEach(t => {
	t.context.persistence = new global.window.PersistenceService({
		getDefaults: () => {}
	});
	t.context.permissions = new global.window.PermissionsService(t.context.persistence);
});

test('installs TabsService constructor', t => {
	t.is(typeof global.window.TabsService, 'function');
});

test('TabsService constructor sets PermissionsService', t => {
	const service = new global.window.TabsService(t.context.permissions);
	t.true(service.PermissionsService instanceof global.window.PermissionsService);
});

test('#createTab calls chrome.tabs.create and returns promise', t => {
	const service = new global.window.TabsService(t.context.permissions);
	const url = 'https://api.github.com/resource';
	global.window.chrome.tabs.create.yieldsAsync({id: 1, url});
	t.is(typeof service.createTab({url}).then, 'function');
	service.createTab({url}).then(tab => {
		t.deepEqual(tab, {id: 1, url});
	});
});

test('#updateTab calls chrome.tabs.update and returns promise', t => {
	const service = new global.window.TabsService(t.context.permissions);
	const url = 'https://api.github.com/resource';
	global.window.chrome.tabs.update.yieldsAsync({id: 1, url});
	t.is(typeof service.updateTab({url}).then, 'function');
	service.updateTab(42, {url}).then(tab => {
		t.deepEqual(tab, {id: 1, url});
		t.deepEqual(global.window.chrome.tabs.update.lastCall.args, [42, {
			id: 1,
			url
		}]);
	});
});

test('#queryTabs calls chrome.tabs.query and returns promise', t => {
	const service = new global.window.TabsService(t.context.permissions);
	const url = 'https://api.github.com/resource';
	const tabs = [{id: 1, url}, {id: 2, url}];
	global.window.chrome.tabs.query.yieldsAsync(tabs);
	t.is(typeof service.queryTabs({url}).then, 'function');
	service.queryTabs({url}).then(matchedTabs => {
		t.deepEqual(matchedTabs, tabs);
	});
});

test('#openTab returns promise', t => {
	const service = new global.window.TabsService(t.context.permissions);
	const url = 'https://api.github.com/resource';
	t.is(typeof service.openTab({url}).then, 'function');
});

test('#openTab creates new tab if querying tabs is not allowed', t => {
	const service = new global.window.TabsService(t.context.permissions);
	const url = 'https://api.github.com/resource';
	service.PermissionsService.queryPermission = sinon.stub().returns(Promise.resolve(false));
	service.createTab = sinon.spy();
	return service.openTab(url).then(() => {
		t.true(service.createTab.calledOnce);
		t.deepEqual(service.createTab.lastCall.args, [{url}]);
	});
});

test('#openTab updates with first matched tab', t => {
	const service = new global.window.TabsService(t.context.permissions);
	const url = 'https://api.github.com/resource';
	const firstTab = {id: 1, url};
	const tabs = [firstTab, {id: 2, url}];

	service.PermissionsService.queryPermission = sinon.stub().returns(Promise.resolve(true));
	service.queryTabs = sinon.stub().returns(Promise.resolve(tabs));
	service.updateTab = sinon.spy();

	return service.openTab(url).then(() => {
		t.deepEqual(service.updateTab.lastCall.args, [firstTab.id, {
			url,
			highlighted: true
		}]);
	});
});

test('#openTab updates empty tab if provided', t => {
	const service = new global.window.TabsService(t.context.permissions);
	const url = 'https://api.github.com/resource';
	const emptyTab = {id: 0, url: 'chrome://newtab/'};

	service.PermissionsService.queryPermission = sinon.stub().returns(Promise.resolve(true));
	service.updateTab = sinon.spy();
	global.window.chrome.tabs.query = sinon.stub().yieldsAsync([]);

	return service.openTab(url, emptyTab).then(() => {
		t.deepEqual(service.updateTab.lastCall.args, [null, {
			url,
			highlighted: false
		}]);
	});
});
