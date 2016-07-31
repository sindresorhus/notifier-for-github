import test from 'ava';
import sinon from 'sinon';
import utils from './utils';

global.window = utils.setupWindow();

require('../extension/src/persistence-service.js');
require('../extension/src/permissions-service.js');

test.beforeEach(t => {
	global.window = Object.assign(global.window, utils.setupWindow());
	t.context.persistence = new global.window.PersistenceService({});
});

test('installs PermissionsService constructor', t => {
	t.is(typeof global.window.PermissionsService, 'function');
});

test('PermissionsService constructor sets PersistenceService', t => {
	const service = new global.window.PermissionsService(t.context.persistence);
	t.true(service.PersistenceService instanceof global.window.PersistenceService);
});

test('#requestPermission method returns Promise', t => {
	const service = new global.window.PermissionsService(t.context.persistence);
	t.is(typeof service.requestPermission('tabs').then, 'function');
});

test('#requestPermission method Promise resolves to chrome.permissions.request callback value', t => {
	const service = new global.window.PermissionsService(t.context.persistence);

	global.window.chrome.permissions.request = sinon.stub().yieldsAsync(true);
	const permissionGranted = service.requestPermission('tabs');

	global.window.chrome.permissions.request = sinon.stub().yieldsAsync(false);
	const permissionDenied = service.requestPermission('tabs');

	return Promise.all([
		permissionGranted,
		permissionDenied
	]).then(res => {
		t.deepEqual(res, [true, false]);
	});
});

test.skip('#requestPermission method returns rejected Promise if chrome.runtime.lastError is set', t => {
	const service = new global.window.PermissionsService(t.context.persistence);
	global.window.chrome.permissions.request = sinon.stub().yieldsAsync();
	return utils.nextTickPromise().then(() => {
		global.window.chrome.runtime.lastError = new Error('#requestPermission failed');
		t.throws(service.requestPermission('tabs'), '#requestPermission failed');
	});
});

// --- Mostly same as #requestPermission except for naming ---

test('#queryPermission method returns Promise', t => {
	const service = new global.window.PermissionsService(t.context.persistence);
	t.is(typeof service.queryPermission('tabs').then, 'function');
});

test('#queryPermission method Promise resolves to chrome.permissions.request callback value', t => {
	const service = new global.window.PermissionsService(t.context.persistence);

	global.window.chrome.permissions.contains = sinon.stub().yieldsAsync(true);
	const permissionGranted = service.queryPermission('tabs');

	global.window.chrome.permissions.contains = sinon.stub().yieldsAsync(false);
	const permissionDenied = service.queryPermission('tabs');

	return Promise.all([
		permissionGranted,
		permissionDenied
	]).then(res => {
		t.deepEqual(res, [true, false]);
	});
});

test.skip('#queryPermission method returns rejected Promise if chrome.runtime.lastError is set', t => {
	const service = new global.window.PermissionsService(t.context.persistence);
	global.window.chrome.permissions.contains = sinon.stub().yieldsAsync();
	return utils.nextTickPromise().then(() => {
		global.window.chrome.runtime.lastError = new Error('#queryPermission failed');
		t.throws(service.queryPermission('tabs'), '#queryPermission failed');
	});
});
