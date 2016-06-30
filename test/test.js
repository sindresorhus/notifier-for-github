import test from 'ava';
import sinon from 'sinon';
import chromeStub from 'chrome-stub';
import LocalStorageMock from 'mock-localstorage';

test.before(() => {
  global.window = {
  	location: {
  		hash: '',
  		host: '',
  		hostname: '',
  		href: '',
  		origin: '',
  		pathname: '',
  		port: '',
  		protocol: '',
  		search: ''
  	}
  };
  global.localStorage = new LocalStorageMock();
  global.chrome = chromeStub;
});

test('should register alarm callback', t => {

	require('../extension/src/api');
	require('../extension/main');
	t.true(chrome.alarms.create.called);

});
