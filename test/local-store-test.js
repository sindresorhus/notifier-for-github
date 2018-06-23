import test from 'ava';
import sinon from 'sinon';
import localStore from '../source/lib/local-store';

test.beforeEach(t => {
	t.context.service = Object.assign({}, localStore);
});

test.serial('#set calls StorageArea#set', async t => {
	const {service} = t.context;

	browser.storage.local.set = sinon.stub().resolves(true);

	await service.set('name', 'notifier-for-github');

	t.true(browser.storage.local.set.calledWith({name: 'notifier-for-github'}));
});

test.serial('#get calls StorageArea#get', async t => {
	const {service} = t.context;

	browser.storage.local.get = sinon.stub().resolves({});

	await service.get('name');

	t.true(browser.storage.local.get.calledWith('name'));
});

test.serial('#remove calls StorageArea#remove', async t => {
	const {service} = t.context;

	browser.storage.local.remove = sinon.spy();

	await service.remove('name');

	t.true(browser.storage.local.remove.calledWith('name'));
});

test.serial('#clear calls StorageArea#clear', async t => {
	const {service} = t.context;

	browser.storage.local.clear = sinon.spy();

	await service.clear('name');

	t.true(browser.storage.local.clear.called);
});
