import test from 'ava';
import browser from 'sinon-chrome';
import {
	getInstances,
	getInstance,
	getEnabledInstances,
	addInstance,
	updateInstance,
	deleteInstance,
	migrateFromSingleInstance
} from '../source/lib/instances-storage.js';

test.beforeEach(() => {
	browser.flush();
	browser.storage.local.get.resolves({});
	browser.storage.local.set.resolves();
	browser.storage.sync.get.resolves({});
});

test.serial('#getInstances returns empty array when no instances', async t => {
	const instances = await getInstances();
	t.deepEqual(instances, []);
});

test.serial('#getInstances returns stored instances', async t => {
	const mockInstances = [
		{id: '1', name: 'GitHub', rootUrl: 'https://github.com/'},
		{id: '2', name: 'GitHub Enterprise', rootUrl: 'https://git.company.com/'}
	];
	browser.storage.local.get.resolves({githubInstances: mockInstances});

	const instances = await getInstances();
	t.deepEqual(instances, mockInstances);
});

test.serial('#getInstance returns instance by id', async t => {
	const mockInstances = [
		{id: '1', name: 'GitHub', rootUrl: 'https://github.com/'},
		{id: '2', name: 'GitHub Enterprise', rootUrl: 'https://git.company.com/'}
	];
	browser.storage.local.get.resolves({githubInstances: mockInstances});

	const instance = await getInstance('2');
	t.deepEqual(instance, mockInstances[1]);
});

test.serial('#getInstance returns undefined for non-existent id', async t => {
	const mockInstances = [
		{id: '1', name: 'GitHub', rootUrl: 'https://github.com/'}
	];
	browser.storage.local.get.resolves({githubInstances: mockInstances});

	const instance = await getInstance('999');
	t.is(instance, undefined);
});

test.serial('#getEnabledInstances returns only enabled instances', async t => {
	const mockInstances = [
		{id: '1', name: 'GitHub', enabled: true},
		{id: '2', name: 'GitHub Enterprise', enabled: false},
		{id: '3', name: 'GitHub Dev', enabled: true}
	];
	browser.storage.local.get.resolves({githubInstances: mockInstances});

	const instances = await getEnabledInstances();
	t.is(instances.length, 2);
	t.true(instances.every(i => i.enabled));
});

test.serial('#addInstance creates new instance with defaults', async t => {
	browser.storage.local.get.resolves({githubInstances: []});

	const data = {
		name: 'GitHub',
		rootUrl: 'https://github.com/',
		token: 'test-token'
	};

	const instance = await addInstance(data);

	t.is(instance.name, 'GitHub');
	t.is(instance.rootUrl, 'https://github.com/');
	t.is(instance.token, 'test-token');
	t.true(instance.enabled);
	t.false(instance.playNotifSound);
	t.false(instance.showDesktopNotif);
	t.truthy(instance.id);
	t.true(browser.storage.local.set.called);
});

test.serial('#addInstance allows more than 4 instances', async t => {
	const mockInstances = [
		{id: '1', name: 'A'},
		{id: '2', name: 'B'},
		{id: '3', name: 'C'},
		{id: '4', name: 'D'}
	];
	browser.storage.local.get.resolves({githubInstances: mockInstances});

	const instance = await addInstance({name: 'E', token: 'test'});
	t.is(instance.name, 'E');
});

test.serial('#updateInstance updates existing instance', async t => {
	const mockInstances = [
		{id: '1', name: 'GitHub', rootUrl: 'https://github.com/', enabled: true}
	];
	browser.storage.local.get.resolves({githubInstances: mockInstances});

	const updated = await updateInstance('1', {name: 'GitHub Updated', enabled: false});

	t.is(updated.name, 'GitHub Updated');
	t.false(updated.enabled);
	t.is(updated.rootUrl, 'https://github.com/');
	t.true(browser.storage.local.set.called);
});

test.serial('#updateInstance throws for non-existent instance', async t => {
	browser.storage.local.get.resolves({githubInstances: []});

	await t.throwsAsync(
		updateInstance('999', {name: 'Test'}),
		{message: 'Instance with ID 999 not found'}
	);
});

test.serial('#deleteInstance removes instance', async t => {
	const mockInstances = [
		{id: '1', name: 'GitHub', colorIndex: 0},
		{id: '2', name: 'GitHub Enterprise', colorIndex: 1}
	];

	browser.storage.local.get.resolves({githubInstances: mockInstances});

	await deleteInstance('1');

	const savedData = browser.storage.local.set.firstCall.args[0];
	t.is(savedData.githubInstances.length, 1);
	t.is(savedData.githubInstances[0].id, '2');
});

test.serial('#migrateFromSingleInstance does nothing if instances exist', async t => {
	const mockInstances = [{id: '1', name: 'GitHub', colorIndex: 0}];
	browser.storage.local.get.resolves({githubInstances: mockInstances});

	await migrateFromSingleInstance();

	const setCalls = browser.storage.local.set.getCalls();
	t.is(setCalls.length, 0);
});

test.serial('#migrateFromSingleInstance migrates old settings', async t => {
	browser.storage.local.get.resolves({});

	browser.storage.sync.get.resolves({
		token: 'old-token',
		rootUrl: 'https://github.com/',
		playNotifSound: true,
		showDesktopNotif: true,
		onlyParticipating: false,
		filterNotifications: true
	});

	await migrateFromSingleInstance();

	const setCalls = browser.storage.local.set.getCalls();
	const instanceSave = setCalls.find(call => call.args[0].githubInstances);
	t.truthy(instanceSave);

	const instance = instanceSave.args[0].githubInstances[0];

	t.is(instance.name, 'GitHub');
	t.is(instance.token, 'old-token');
	t.is(instance.rootUrl, 'https://github.com/');
	t.true(instance.playNotifSound);
	t.true(instance.showDesktopNotif);
	t.false(instance.onlyParticipating);
	t.true(instance.filterNotifications);
});
