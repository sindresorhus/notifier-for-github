import test from 'ava';
import sinon from 'sinon';
import utils from './utils';

global.window = utils.setupWindow();

const PersistenceService = require('../extension/src/persistence-service.js');
const DefaultsService = require('../extension/src/defaults-service.js');

test.beforeEach(t => {
	t.context.persistence = Object.assign({}, PersistenceService);
});

test('#get calls localStorage#getItem', t => {
	const service = t.context.persistence;

	window.localStorage.getItem = sinon.spy();
	service.get('name');

	t.true(window.localStorage.getItem.calledWith('name'));
});

test('#get converts "true" and "false" strings to booleans', t => {
	const service = t.context.persistence;

	window.localStorage.getItem = sinon.stub().returns('true');
	t.true(service.get('boolean'));

	window.localStorage.getItem = sinon.stub().returns('false');
	t.false(service.get('boolean'));
});

test('#get looks up in defaults if item is null', t => {
	const service = t.context.persistence;

	window.localStorage.getItem = sinon.stub().returns(null);

	t.is(service.get('rootUrl'), DefaultsService.getDefaults().rootUrl);
});

test('#get returns undefined if no item found in defaults', t => {
	const service = t.context.persistence;

	window.localStorage.getItem = sinon.stub().returns(null);

	t.is(service.get('no such thing'), undefined);
});

test('#set calls localStorage#set', t => {
	const service = t.context.persistence;
	window.localStorage.setItem = sinon.spy();

	const obj = {value: 42};
	service.set('name', obj);

	t.true(window.localStorage.setItem.calledWith('name', obj));
});

test('#reset calls localStorage#clear', t => {
	const service = t.context.persistence;

	window.localStorage.clear = sinon.spy();
	service.reset();

	t.true(window.localStorage.clear.called);
});

test('#remove calls localStorage#removeItem', t => {
	const service = t.context.persistence;

	window.localStorage.removeItem = sinon.spy();
	service.remove('name');

	t.true(global.window.localStorage.removeItem.calledWith('name'));
});
