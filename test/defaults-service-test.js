import test from 'ava';
import utils from './utils';

global.window = utils.setupWindow();
require('../extension/src/defaults-service.js');

test('installs DefaultsService constructor', t => {
	t.is(typeof global.window.DefaultsService, 'function');
});

test('#getDefaults returns defaults objects', t => {
	const service = new global.window.DefaultsService();

	const defaults = service.getDefaults();
	t.is(typeof defaults, 'object');
	t.is(defaults.rootUrl, 'https://api.github.com/');
	t.is(defaults.oauthToken, '');
	t.is(defaults.useParticipatingCount, false);
	t.is(defaults.interval, 60);
});

test('#getBadgeDefaultColor return array of 4 numbers between 0 and 255 inclusive', t => {
	const service = new global.window.DefaultsService();
	const color = service.getBadgeDefaultColor();
	t.is(color.length, 4);

	color.forEach(n => {
		t.is(typeof n, 'number');
		t.true(n >= 0);
		t.true(n <= 255);
	});
});

test('#getBadgeErrorColor return array of 4 numbers not same as default', t => {
	const service = new global.window.DefaultsService();
	const color = service.getBadgeErrorColor();
	t.is(color.length, 4);
	t.notDeepEqual(color, service.getBadgeDefaultColor);

	color.forEach(n => {
		t.is(typeof n, 'number');
		t.true(n >= 0);
		t.true(n <= 255);
	});
});

test('#getNotificationReasonText returns notification reasons', t => {
	const service = new global.window.DefaultsService();

	const reasons = [
		'subscribed',
		'manual',
		'author',
		'comment',
		'mention',
		'team_mention',
		'state_change',
		'assign'
	];

	const invalidReasons = [
		'no such reason',
		undefined,
		NaN,
		{foo: 42}
	];

	reasons.forEach(reason => {
		t.truthy(service.getNotificationReasonText(reason));
	});

	invalidReasons.forEach(reason => {
		t.is(service.getNotificationReasonText(reason), '');
	});
});

test('#getDefaultTitle returns string', t => {
	const service = new global.window.DefaultsService();
	t.is(typeof service.getDefaultTitle(), 'string');
});

test('#getErrorSymbol returns either "X" or "?" strings', t => {
	const service = new global.window.DefaultsService();

	t.is(service.getErrorSymbol({message: 'missing token'}), 'X');

	const invalidMessages = [
		'no such thing',
		undefined,
		NaN,
		{foo: 312}
	];

	invalidMessages.forEach(message => {
		t.is(service.getErrorSymbol({message}), '?');
	});
});
