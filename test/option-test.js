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
	t.context.element = {
		addEventListener: sinon.spy()
	};
	global.window.document = {
		getElementById: sinon.stub().returns(t.context.element)
	};

	t.context.option = new global.window.Option(t.context.persistence, {
		id: 'id',
		storageKey: 'key',
		valueType: 'value',
		onChange() {}
	});
});

test('installs Option constructor', t => {
	t.is(typeof global.window.Option, 'function');
});

test('Option constructor initializes option object', t => {
	t.is(t.context.option.element, t.context.element);
	t.true(global.window.document.getElementById.calledOnce);
	t.true(t.context.element.addEventListener.calledWithMatch('change'));
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
