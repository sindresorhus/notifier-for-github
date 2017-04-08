import EventEmitter from 'events';
import test from 'ava';
import sinon from 'sinon';
import util from './util';

global.window = util.setupWindow();
const sandbox = sinon.sandbox.create();

const PersistenceService = require('../extension/src/persistence-service.js');
const Option = require('../extension/src/option.js');

test.beforeEach(t => {
	const emitter = new EventEmitter();

	emitter.addEventListener = emitter.on.bind(emitter);
	t.context.element = emitter;

	window.document = {
		getElementById: sinon.stub().returns(t.context.element)
	};

	t.context.optionParams = {
		id: 'id',
		storageKey: 'key',
		valueType: 'value',
		onChange() {}
	};
	window.chrome.storage.sync = {get() {}, set() {}};
	t.context.option = new Option(t.context.optionParams);
});

test.afterEach(() => {
	sandbox.restore();
});

test('#readValue reads value from PersistenceService', async t => {
	window.localStorage.getItem = sinon.stub().returns('value');

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('key').yieldsAsync('value');

	await t.context.option.readValue();

	t.true(window.chrome.storage.sync.get.calledWith('key'));
	t.is(t.context.option.element.value, 'value');
});

test('#writeValue writes value to PersistenceService', async t => {
	PersistenceService.set = sinon.stub();
	t.context.option.element.value = 'value';
	await t.context.option.writeValue();

	t.true(PersistenceService.set.calledWith('key', 'value'));
});

test('#writeValue respects override', async t => {
	PersistenceService.set = sinon.stub();
	t.context.option.element.value = 'defaultValue';
	await t.context.option.writeValue('newValue');

	t.true(PersistenceService.set.calledWith('key', 'newValue'));
	t.is(t.context.option.element.value, 'newValue');
});

test('#onChange handler passes Option as an argument', t => {
	const params = Object.assign({}, t.context.optionParams, {onChange: sinon.spy()});
	const option = new Option(params);

	t.context.element.emit('change');
	t.deepEqual(params.onChange.lastCall.args, [option]);
});
