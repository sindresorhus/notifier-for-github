import test from 'ava';
import localStore from '../source/lib/local-store';

test.beforeEach(t => {
	browser.flush();

	t.context.service = Object.assign({}, localStore);
});

test.serial('#set calls StorageArea#set', async t => {
	const {service} = t.context;

	browser.storage.local.set.resolves(true);

	await service.set('name', 'notifier-for-github');

	t.true(browser.storage.local.set.calledWith({name: 'notifier-for-github'}));
});

test.serial('#get calls StorageArea#get', async t => {
	const {service} = t.context;

	browser.storage.local.get.resolves({});

	await service.get('name');

	t.true(browser.storage.local.get.calledWith('name'));
});

test.serial('#remove calls StorageArea#remove', async t => {
	const {service} = t.context;

	await service.remove('name');

	t.true(browser.storage.local.remove.calledWith('name'));
});

test.serial('#clear calls StorageArea#clear', async t => {
	const {service} = t.context;

	await service.clear('name');

	t.true(browser.storage.local.clear.called);
});
