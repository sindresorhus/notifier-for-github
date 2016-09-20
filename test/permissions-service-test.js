import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();

const PermissionsService = require('../extension/src/permissions-service.js');

test.beforeEach(t => {
	t.context.service = Object.assign({}, PermissionsService);
});

test('#requestPermission returns Promise', t => {
	const service = t.context.service;

	return service.requestPermission('tabs').then(() => {
		t.pass();
	});
});

test.serial('#requestPermission Promise resolves to chrome.permissions.request callback value', t => {
	const service = t.context.service;

	window.chrome.permissions.request = sinon.stub().yieldsAsync(true);
	const permissionGranted = service.requestPermission('tabs');

	window.chrome.permissions.request = sinon.stub().yieldsAsync(false);
	const permissionDenied = service.requestPermission('tabs');

	return Promise.all([
		permissionGranted,
		permissionDenied
	]).then(res => {
		t.deepEqual(res, [true, false]);
	});
});

test('#requestPermission returns rejected Promise if chrome.runtime.lastError is set', t => {
	const service = t.context.service;

	return util.nextTickPromise().then(() => {
		window.chrome.permissions.request = sinon.stub().yieldsAsync();
		window.chrome.runtime.lastError = new Error('#requestPermission failed');
		return service.requestPermission('tabs').then(() => t.fail()).catch(() => t.pass());
	});
});

// --- Mostly same as #requestPermission except for naming ---

test('#queryPermission returns Promise', t => {
	const service = t.context.service;

	return service.queryPermission('tabs').then(() => {
		t.pass();
	});
});

test.serial('#queryPermission Promise resolves to chrome.permissions.request callback value', t => {
	const service = t.context.service;

	window.chrome.permissions.contains = sinon.stub().yieldsAsync(true);
	const permissionGranted = service.queryPermission('tabs');

	window.chrome.permissions.contains = sinon.stub().yieldsAsync(false);
	const permissionDenied = service.queryPermission('tabs');

	return Promise.all([
		permissionGranted,
		permissionDenied
	]).then(res => {
		t.deepEqual(res, [true, false]);
	});
});

test('#queryPermission returns rejected Promise if chrome.runtime.lastError is set', t => {
	const service = t.context.service;

	return util.nextTickPromise().then(() => {
		window.chrome.permissions.contains = sinon.stub().yieldsAsync();
		window.chrome.runtime.lastError = new Error('#queryPermission failed');
		return service.queryPermission('tabs').then(() => t.fail()).catch(() => t.pass());
	});
});
