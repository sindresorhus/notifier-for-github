import test from 'ava';
import * as defaults from '../source/lib/defaults';

test.serial('#getBadgeDefaultColor return array of 4 numbers between 0 and 255 inclusive', t => {
	const color = defaults.getBadgeDefaultColor();

	t.is(color.length, 4);

	for (const n of color) {
		t.is(typeof n, 'number');
		t.true(n >= 0);
		t.true(n <= 255);
	}
});

test.serial('#getBadgeErrorColor return array of 4 numbers not same as default', t => {
	const color = defaults.getBadgeErrorColor();
	t.is(color.length, 4);
	t.notDeepEqual(color, defaults.getBadgeDefaultColor);

	for (const n of color) {
		t.is(typeof n, 'number');
		t.true(n >= 0);
		t.true(n <= 255);
	}
});

test.serial('#getNotificationReasonText returns notification reasons', t => {
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
		t.truthy(defaults.getNotificationReasonText(reason));
	}

	for (const reason of invalidReasons) {
		t.is(defaults.getNotificationReasonText(reason), '');
	}
});

test.serial('#getErrorSymbol returns either "X" or "?" strings', t => {
	t.is(defaults.getErrorSymbol({message: 'missing token'}), 'X');

	const invalidMessages = [
		'no such thing',
		undefined,
		NaN,
		{foo: 312}
	];

	for (const message of invalidMessages) {
		t.is(defaults.getErrorSymbol({message}), '?');
	}
});
