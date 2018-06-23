import test from 'ava';
import sinon from 'sinon';
import pImmediate from 'p-immediate';

import * as permissions from '../source/lib/permissions-service';

test.beforeEach(t => {
	t.context.service = Object.assign({}, permissions);
});

test('#requestPermission returns Promise', t => {
	const {service} = t.context;

	t.true(service.requestPermission('tabs') instanceof Promise);
});

test.serial('#requestPermission Promise resolves to chrome.permissions.request callback value', async t => {
	const {service} = t.context;

	browser.permissions.request = sinon.stub().yieldsAsync(true);
	const permissionGranted = service.requestPermission('tabs');

	browser.permissions.request = sinon.stub().yieldsAsync(false);
	const permissionDenied = service.requestPermission('tabs');

	const response = await Promise.all([permissionGranted, permissionDenied]);

	t.deepEqual(response, [true, false]);
});

test('#requestPermission returns rejected Promise if chrome.runtime.lastError is set', async t => {
	const {service} = t.context;

	await pImmediate();

	browser.permissions.request = sinon.stub().yieldsAsync();
	browser.runtime.lastError = new Error('#requestPermission failed');

	await t.throws(service.requestPermission('tabs'));
});

// --- Mostly same as #requestPermission except for naming ---

test('#queryPermission returns Promise', t => {
	const {service} = t.context;

	t.true(service.queryPermission('tabs') instanceof Promise);
});

test.serial('#queryPermission Promise resolves to chrome.permissions.request callback value', async t => {
	const {service} = t.context;

	browser.permissions.contains = sinon.stub().yieldsAsync(true);
	const permissionGranted = service.queryPermission('tabs');

	browser.permissions.contains = sinon.stub().yieldsAsync(false);
	const permissionDenied = service.queryPermission('tabs');

	const response = await Promise.all([permissionGranted, permissionDenied]);

	t.deepEqual(response, [true, false]);
});

test('#queryPermission returns rejected Promise if chrome.runtime.lastError is set', async t => {
	const {service} = t.context;

	await pImmediate();

	browser.permissions.contains = sinon.stub().yieldsAsync();
	browser.runtime.lastError = new Error('#queryPermission failed');

	await t.throws(service.queryPermission('tabs'));
});
