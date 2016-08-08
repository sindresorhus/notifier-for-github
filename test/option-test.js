import EventEmitter from 'events';
import test from 'ava';
import sinon from 'sinon';
import utils from './utils';

global.window = utils.setupWindow();
require('../extension/src/defaults-service.js');
require('../extension/src/persistence-service.js');
require('../extension/src/permissions-service.js');
require('../extension/src/option.js');

test.beforeEach(t => {
	t.context.defaults = new global.window.DefaultsService();
	t.context.persistence = new global.window.PersistenceService(t.context.defaults);
	t.context.permissions = new global.window.PermissionsService(t.context.persistence);

	const emitter = new EventEmitter();
	emitter.addEventListener = emitter.on.bind(emitter);
	t.context.element = emitter;

	global.window.document = {
		getElementById: sinon.stub().returns(t.context.element)
	};

	t.context.optionParams = {
		id: 'id',
		storageKey: 'key',
		valueType: 'value',
		onChange() {}
	};
	t.context.option = new global.window.Option(t.context.persistence, t.context.optionParams);
});

test('installs Option constructor', t => {
	t.is(typeof global.window.Option, 'function');
});

test('Option constructor initializes option object', t => {
	t.context.element.addEventListener = sinon.spy();
	global.window.document.getElementById.reset();

	const option = new global.window.Option(t.context.persistence, t.context.optionParams);

	t.is(option.element, t.context.element);
	t.true(global.window.document.getElementById.calledOnce);
	t.true(t.context.element.addEventListener.calledWithMatch('change', sinon.match.func));
});

test('#readValue reads value from PersistenceService', t => {
	t.context.option.PersistenceService.get = sinon.stub().returns('value');
	t.context.option.readValue();

	t.true(t.context.persistence.get.calledWith('key'));
	t.is(t.context.option.element.value, 'value');
});

test('#writeValue writes value to PersistenceService', t => {
	t.context.option.PersistenceService.set = sinon.stub();
	t.context.option.element.value = 'value';
	t.context.option.writeValue();

	t.true(t.context.persistence.set.calledWith('key', 'value'));
});

test('#writeValue respects override', t => {
	t.context.option.PersistenceService.set = sinon.stub();
	t.context.option.element.value = 'defaultValue';
	t.context.option.writeValue('newValue');

	t.true(t.context.persistence.set.calledWith('key', 'newValue'));
	t.is(t.context.option.element.value, 'newValue');
});

test('#onChange handler passes Option as an argument', t => {
	const params = Object.assign({}, t.context.optionParams, {onChange: sinon.spy()});
	const option = new global.window.Option(t.context.persistence, params);

	t.context.element.emit('change');
	t.deepEqual(params.onChange.lastCall.args, [option]);
});
