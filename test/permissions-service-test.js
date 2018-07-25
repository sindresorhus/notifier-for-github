import test from 'ava';
import pImmediate from 'p-immediate';

import * as permissions from '../source/lib/permissions-service';

test.beforeEach(t => {
	t.context.service = Object.assign({}, permissions);

	browser.runtime.lastError = null;
});

test.serial('#requestPermission returns Promise', t => {
	const {service} = t.context;

	t.true(service.requestPermission('tabs') instanceof Promise);
});

test.serial('#requestPermission Promise resolves to browser.permissions.request callback value', async t => {
	const {service} = t.context;

	browser.permissions.request.resolves(true);
	const permissionGranted = service.requestPermission('tabs');

	browser.permissions.request.resolves(false);
	const permissionDenied = service.requestPermission('tabs');

	const response = await Promise.all([permissionGranted, permissionDenied]);

	t.deepEqual(response, [true, false]);
});

test.serial('#requestPermission returns rejected Promise if browser.runtime.lastError is set', async t => {
	const {service} = t.context;

	await pImmediate();

	browser.permissions.request.resolves();
	browser.runtime.lastError = '#requestPermission failed';

	try {
		await service.requestPermission('tabs');
		t.fail();
	} catch (error) {
		t.pass();
	}
});

// --- Mostly same as #requestPermission except for naming ---

test.serial('#queryPermission returns Promise', t => {
	const {service} = t.context;

	t.true(service.queryPermission('tabs') instanceof Promise);
});

test.serial('#queryPermission Promise resolves to browser.permissions.request callback value', async t => {
	const {service} = t.context;

	browser.permissions.contains.resolves(true);
	const permissionGranted = service.queryPermission('tabs');

	browser.permissions.contains.resolves(false);
	const permissionDenied = service.queryPermission('tabs');

	const response = await Promise.all([permissionGranted, permissionDenied]);

	t.deepEqual(response, [true, false]);
});

test.serial('#queryPermission returns rejected Promise if browser.runtime.lastError is set', async t => {
	const {service} = t.context;

	await pImmediate();

	browser.permissions.contains.resolves();
	browser.runtime.lastError = '#queryPermission failed';

	try {
		await service.queryPermission('tabs');
		t.fail();
	} catch (error) {
		t.pass();
	}
});
