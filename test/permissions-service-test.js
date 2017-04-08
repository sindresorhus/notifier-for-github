import test from 'ava';
import sinon from 'sinon';
import pImmediate from 'p-immediate';
import util from './util';

global.window = util.setupWindow();
const sandbox = sinon.sandbox.create();

const PermissionsService = require('../extension/src/permissions-service.js');

test.beforeEach(t => {
	t.context.service = Object.assign({}, PermissionsService);
	window.chrome.permissions = {request() {}, contains() {}};
	window.chrome.storage.sync = {get() {}, set() {}};
	sandbox.stub(window.chrome.permissions, 'request');
	sandbox.stub(window.chrome.permissions, 'contains');
});

test.afterEach(() => {
	sandbox.restore();
	window.chrome.runtime.lastError = null;
});

test('#requestPermission returns Promise', async t => {
	const service = t.context.service;

	window.chrome.permissions.request.yieldsAsync(true);

	const permission = await service.requestPermission('tabs');
	t.true(permission);
});

test('#requestPermission Promise resolves to chrome.permissions.request callback value', async t => {
	const service = t.context.service;

	window.chrome.permissions.request.yieldsAsync(true);
	const permissionGranted = service.requestPermission('tabs');

	window.chrome.permissions.request.reset();

	window.chrome.permissions.request.yieldsAsync(false);
	const permissionDenied = service.requestPermission('tabs');

	const response = await Promise.all([permissionGranted, permissionDenied]);

	t.deepEqual(response, [true, false]);
});

test('#requestPermission returns rejected Promise if chrome.runtime.lastError is set', async t => {
	const service = t.context.service;

	await pImmediate();

	window.chrome.permissions.request.yieldsAsync(true);
	window.chrome.runtime.lastError = new Error('#requestPermission failed');

	await t.throws(service.requestPermission('tabs'));
});

// --- Mostly same as #requestPermission except for naming ---

test('#queryPermission returns Promise', async t => {
	const service = t.context.service;

	window.chrome.permissions.contains.yieldsAsync(true);

	const permission = await service.queryPermission('tabs');
	t.true(permission);
});

test('#queryPermission Promise resolves to chrome.permissions.request callback value', async t => {
	const service = t.context.service;

	window.chrome.permissions.contains.yieldsAsync(true);
	const permissionGranted = service.queryPermission('tabs');

	window.chrome.permissions.contains.reset();

	window.chrome.permissions.contains.yieldsAsync(false);
	const permissionDenied = service.queryPermission('tabs');

	const response = await Promise.all([permissionGranted, permissionDenied]);

	t.deepEqual(response, [true, false]);
});

test('#queryPermission returns rejected Promise if chrome.runtime.lastError is set', async t => {
	const service = t.context.service;

	await pImmediate();

	window.chrome.permissions.contains.yieldsAsync(true);
	window.chrome.runtime.lastError = new Error('#queryPermission failed');

	await t.throws(service.queryPermission('tabs'));
});
