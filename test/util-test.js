import test from 'ava';
import {isChrome, isNotificationTargetPage} from '../source/util';

test.beforeEach(t => {
	t.context.defaultOptions = {
		options: {
			rootUrl: 'https://api.github.com'
		}
	};

	browser.flush();

	global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.80 Safari/537.36';

	browser.storage.sync.get.callsFake((key, cb) => {
		cb(t.context.defaultOptions);
	});
});

test.serial('isChrome validates User-Agent string', t => {
	// Defualt UA string set in fixtures
	t.is(isChrome(), true);

	// Empty UA string
	global.navigator.userAgent = '';
	t.is(isChrome(), false);

	// Firefox
	global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0';
	t.is(isChrome(), false);
});

test.serial('isNotificationTargetPage returns true for only valid pages', async t => {
	// Invalid pages
	t.throwsAsync(() => isNotificationTargetPage(''));
	t.is(await isNotificationTargetPage('https://github.com'), false);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus'), false);
	t.is(await isNotificationTargetPage('https://github.com/notifications/read'), false);
	t.is(await isNotificationTargetPage('https://github.com/commit'), false);
	t.is(await isNotificationTargetPage('https://github.com/commits'), false);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/commit'), false);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/commits'), false);

	// Valid pages
	t.is(await isNotificationTargetPage('https://github.com/notifications'), true);
	t.is(await isNotificationTargetPage('https://github.com/notifications?all=1'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/notifications'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/notifications'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/issues/1'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/issues/1#issue-comment-12345'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/pull/180'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/pull/180/files'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/pull/180/files?diff=unified'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/pull/180/commits'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/pull/180/commits/782fc9132eb515a9b39232893326f3960389918e'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/commit/master'), true);
	t.is(await isNotificationTargetPage('https://github.com/sindresorhus/notifier-for-github/commit/782fc9132eb515a9b39232893326f3960389918e'), true);
});
