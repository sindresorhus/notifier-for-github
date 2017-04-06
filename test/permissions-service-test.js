import test from 'ava';
import sinon from 'sinon';
import pImmediate from 'p-immediate';
import util from './util';

global.window = util.setupWindow();
const sandbox = sinon.sandbox.create();

const PermissionsService = require('../extension/src/permissions-service.js');

test.beforeEach(t => {
	t.context.service = Object.assign({}, PermissionsService);
	window.chrome.permissions.request = () => {};
	window.chrome.permissions.contains = () => {};
});

test.afterEach(t => {
	sandbox.restore();
	window.chrome.runtime.lastError = null;
});

test('#requestPermission returns Promise', async t => {
	const service = t.context.service;

	sandbox.stub(window.chrome.permissions, 'request').yieldsAsync(true);

	const permissions = await service.requestPermission('tabs');
	t.pass();
});

test('#requestPermission Promise resolves to chrome.permissions.request callback value', async t => {
	const service = t.context.service;

	window.chrome.permissions.request = sinon.stub().yieldsAsync(true);
	const permissionGranted = service.requestPermission('tabs');

	window.chrome.permissions.request = sinon.stub().yieldsAsync(false);
	const permissionDenied = service.requestPermission('tabs');

	const response = await Promise.all([permissionGranted, permissionDenied]);

	t.deepEqual(response, [true, false]);
});

test('#requestPermission returns rejected Promise if chrome.runtime.lastError is set', async t => {
	const service = t.context.service;

	await pImmediate();

	window.chrome.permissions.request = sinon.stub().yieldsAsync();
	window.chrome.runtime.lastError = new Error('#requestPermission failed');

	await t.throws(service.requestPermission('tabs'));
});

// --- Mostly same as #requestPermission except for naming ---

test('#queryPermission returns Promise', async t => {
	const service = t.context.service;

	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);

	const permission = await service.queryPermission('tabs');
	t.pass();
});

test('#queryPermission Promise resolves to chrome.permissions.request callback value', async t => {
	const service = t.context.service;

	window.chrome.permissions.contains = sinon.stub().yieldsAsync(true);
	const permissionGranted = service.queryPermission('tabs');

	window.chrome.permissions.contains = sinon.stub().yieldsAsync(false);
	const permissionDenied = service.queryPermission('tabs');

	const response = await Promise.all([permissionGranted, permissionDenied]);

	t.deepEqual(response, [true, false]);
});

test('#queryPermission returns rejected Promise if chrome.runtime.lastError is set', async t => {
	const service = t.context.service;

	await pImmediate();

	window.chrome.permissions.contains = sinon.stub().yieldsAsync();
	window.chrome.runtime.lastError = new Error('#queryPermission failed');

	await t.throws(service.queryPermission('tabs'));
});
