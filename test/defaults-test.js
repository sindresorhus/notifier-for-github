import test from 'ava';

const Defaults = require('../source/lib/defaults.js');

test('#getBadgeDefaultColor return array of 4 numbers between 0 and 255 inclusive', t => {
	const color = Defaults.getBadgeDefaultColor();

	t.is(color.length, 4);

	color.forEach(n => {
		t.is(typeof n, 'number');
		t.true(n >= 0);
		t.true(n <= 255);
	});
});

test('#getBadgeErrorColor return array of 4 numbers not same as default', t => {
	const color = Defaults.getBadgeErrorColor();
	t.is(color.length, 4);
	t.notDeepEqual(color, Defaults.getBadgeDefaultColor);

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
		t.truthy(Defaults.getNotificationReasonText(reason));
	}

	for (const reason of invalidReasons) {
		t.is(Defaults.getNotificationReasonText(reason), '');
	}
});

test('#getErrorSymbol returns either "X" or "?" strings', t => {
	t.is(Defaults.getErrorSymbol({message: 'missing token'}), 'X');

	const invalidMessages = [
		'no such thing',
		undefined,
		NaN,
		{foo: 312}
	];

	for (const message of invalidMessages) {
		t.is(Defaults.getErrorSymbol({message}), '?');
	}
});
