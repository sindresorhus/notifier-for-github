import test from 'ava';

const DefaultsService = require('../extension/src/defaults-service.js');

test('#getDefaults returns defaults objects', t => {
	const defaults = DefaultsService.getDefaults();

	t.is(typeof defaults, 'object');
	t.is(defaults.rootUrl, 'https://api.github.com/');
	t.is(defaults.oauthToken, '');
	t.is(defaults.useParticipatingCount, false);
	t.is(defaults.interval, 60);
});

test('#getBadgeDefaultColor return array of 4 numbers between 0 and 255 inclusive', t => {
	const color = DefaultsService.getBadgeDefaultColor();

	t.is(color.length, 4);

	color.forEach(n => {
		t.is(typeof n, 'number');
		t.true(n >= 0);
		t.true(n <= 255);
	});
});

test('#getBadgeErrorColor return array of 4 numbers not same as default', t => {
	const color = DefaultsService.getBadgeErrorColor();
	t.is(color.length, 4);
	t.notDeepEqual(color, DefaultsService.getBadgeDefaultColor);

	color.forEach(n => {
		t.is(typeof n, 'number');
		t.true(n >= 0);
		t.true(n <= 255);
	});
});

test('#getNotificationReasonText returns notification reasons', t => {
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

	for (const reason of reasons) {
		t.truthy(DefaultsService.getNotificationReasonText(reason));
	}

	for (const reason of invalidReasons) {
		t.is(DefaultsService.getNotificationReasonText(reason), '');
	}
});

test('#getDefaultTitle returns string', t => {
	t.is(typeof DefaultsService.getDefaultTitle(), 'string');
});

test('#getErrorSymbol returns either "X" or "?" strings', t => {
	t.is(DefaultsService.getErrorSymbol({message: 'missing token'}), 'X');

	const invalidMessages = [
		'no such thing',
		undefined,
		NaN,
		{foo: 312}
	];

	for (const message of invalidMessages) {
		t.is(DefaultsService.getErrorSymbol({message}), '?');
	}
});
