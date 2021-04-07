import test from 'ava';
import * as permissions from '../source/lib/permissions-service.js';

test.beforeEach(t => {
	t.context.service = Object.assign({}, permissions);
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
