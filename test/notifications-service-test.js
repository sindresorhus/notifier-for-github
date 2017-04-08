import test from 'ava';
import sinon from 'sinon';
import moment from 'moment';
import util from './util';
import pImmediate from 'p-immediate';

global.window = util.setupWindow();
const sandbox = sinon.sandbox.create();

const NotificationsService = require('../extension/src/notifications-service.js');
const Defaults = require('../extension/src/defaults.js');

test.beforeEach(t => {
	t.context.service = Object.assign({}, NotificationsService);
	t.context.notificationId = (Math.random() * 1000 | 0).toString();
	t.context.notificationUrl = `https://api.github.com/notifications/${t.context.notificationId}`;
	t.context.notificationsUrl = 'https://github.com/user/notifications';
	t.context.notificationHtmlUrl = `https://github.com/user/repo/issues/${t.context.notificationId}`;

	t.context.defaultResponse = {
		json() {
			return {
				/* eslint-disable camelcase */
				html_url: t.context.notificationHtmlUrl
				/* eslint-enable camelcase */
			};
		}
	};

	window.chrome.storage.sync = { get() {}, remove() {}, set() {} };

	sandbox.stub(window.chrome.storage.sync, 'get')
		.withArgs('useParticipatingCount').yieldsAsync(false)
		.withArgs('rootUrl').yieldsAsync('root/')
		.withArgs('oauthToken').yieldsAsync('token');
	sandbox.stub(window.chrome.storage.sync, 'set').yieldsAsync();

	window.fetch = () => {};
	window.chrome.tabs = { create() {}, query() {}, clear() {} };
	window.chrome.notifications = { clear() {}, create() {} };
	window.chrome.permissions = { contains() {} };

	sandbox.stub(window.chrome.notifications, 'clear').yieldsAsync();
	sandbox.stub(window.chrome.notifications, 'create');
	sandbox.stub(window.chrome.tabs, 'create').yieldsAsync();
});

test.afterEach(t => {
	sandbox.restore();
});

test('#openNotification gets notification url by notificationId from PersistenceService', async t => {
	const service = t.context.service;

	sandbox.stub(window.chrome.tabs, 'query').yieldsAsync([]);

	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);
	sandbox.stub(window, 'fetch').returns(Promise.resolve(t.context.defaultResponse));

	window.chrome.storage.sync.get
		.withArgs(t.context.notificationId).yieldsAsync(t.context.notificationsUrl);

	await service.openNotification(t.context.notificationId);

	t.true(window.chrome.storage.sync.get.calledWith(t.context.notificationId));
});

test('#openNotification clears notification from queue by notificationId', async t => {
	const service = t.context.service;

	sandbox.stub(window.chrome.tabs, 'query').yieldsAsync([]);
	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);
	sandbox.stub(window, 'fetch').returns(Promise.resolve(t.context.defaultResponse));

	window.chrome.storage.sync.get
		.withArgs(t.context.notificationId).yieldsAsync(t.context.notificationsUrl);

	await service.openNotification(t.context.notificationId);

	t.true(window.chrome.notifications.clear.calledWithMatch(t.context.notificationId));
});

test('#openNotification skips network requests if no url returned by PersistenceService', async t => {
	const service = t.context.service;

	sandbox.stub(window.chrome.tabs, 'query').yieldsAsync([]);
	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);

	window.chrome.storage.sync.get
		.withArgs(t.context.notificationId).yieldsAsync(null);
	sandbox.stub(window, 'fetch').returns(Promise.resolve(t.context.defaultResponse));

	await service.openNotification(t.context.notificationId);

	t.false(window.fetch.called);
});

test('#openNotification closes notification if no url returned by PersistenceService', async t => {
	const service = t.context.service;

	sandbox.stub(window.chrome.tabs, 'query').yieldsAsync([]);
	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);

	window.chrome.storage.sync.get
		.withArgs(t.context.notificationId).yieldsAsync(null);

	sandbox.spy(service, 'closeNotification');

	await service.openNotification(t.context.notificationId);

	t.true(service.closeNotification.calledOnce);
});

test('#openNotification opens tab with url from network response', async t => {
	const service = t.context.service;

	sandbox.stub(window.chrome.tabs, 'query').yieldsAsync([]);
	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);
	sandbox.stub(window, 'fetch').returns(Promise.resolve(t.context.defaultResponse));

	window.chrome.storage.sync.get
		.withArgs(t.context.notificationId).yieldsAsync(t.context.notificationsUrl);

	await service.openNotification(t.context.notificationId);

	t.true(window.chrome.tabs.create.calledWith({url: t.context.notificationHtmlUrl}));
});

test('#openNotification closes notification on error', async t => {
	const service = t.context.service;

	sandbox.stub(window.chrome.tabs, 'query').yieldsAsync([]);
	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);
	sandbox.stub(window, 'fetch').returns(Promise.reject(new Error('error')));

	window.chrome.storage.sync.get
		.withArgs(t.context.notificationId).yieldsAsync(t.context.notificationsUrl);

	await service.openNotification(t.context.notificationId);

	t.true(window.chrome.notifications.clear.calledWith(t.context.notificationId));
});

test('#openNotification opens nofifications tab on error', async t => {
	const service = t.context.service;

	sandbox.stub(window.chrome.tabs, 'query').yieldsAsync([]);
	sandbox.stub(window.chrome.permissions, 'contains').yieldsAsync(true);
	sandbox.stub(window, 'fetch').returns(Promise.reject(new Error('error')));

	window.chrome.storage.sync.get
		.withArgs(t.context.notificationId).yieldsAsync(t.context.notificationsUrl);

	await service.openNotification(t.context.notificationId);

	t.true(window.chrome.tabs.create.calledWith({url: 'root/notifications'}));
});

test('#closeNotification returns promise and clears notifications by id', async t => {
	const service = t.context.service;

	await service.closeNotification(t.context.notificationId);

	t.true(window.chrome.notifications.clear.calledWith(t.context.notificationId));
});

test('#removeNotification removes notifications from storage', async t => {
	const service = t.context.service;

	sandbox.spy(window.chrome.storage.sync, 'remove');

	await service.removeNotification(t.context.notificationId);

	t.true(window.chrome.storage.sync.remove.calledWith(t.context.notificationId));
});

test('#checkNotifications makes API request and shows notifications', async t => {
	const service = t.context.service;
	const response = {
		json() {
			return Promise.resolve([]);
		}
	};

	sandbox.stub(window, 'fetch').returns(response);
	sandbox.spy(service, 'showNotifications');

	await service.checkNotifications();

	t.true(service.showNotifications.calledWith([]));
});

test('#getNotificationObject returns Notification object made via options and Defaults method call', t => {
	const service = t.context.service;
	const title = 'notification title';
	const repositoryName = 'user/repo';
	const reason = 'subscribed';
	const notification = service.getNotificationObject({
		subject: {title},
		repository: {full_name: repositoryName}, // eslint-disable-line camelcase
		reason
	});

	t.deepEqual(notification, {
		title,
		message: repositoryName,
		type: 'basic',
		iconUrl: 'icon-notif-128.png',
		contextMessage: Defaults.getNotificationReasonText(reason)
	});
});

test('#filterNotificationsByDate filters latest notifications', t => {
	const service = t.context.service;
	/* eslint-disable camelcase */
	const notifications = [{
		updated_at: moment().subtract(9, 'days').format()
	}, {
		updated_at: moment().subtract(8, 'days').format()
	}, {
		updated_at: moment().subtract(5, 'days').format()
	}];
	/* eslint-enable camelcase */

	const latestNotifications = service.filterNotificationsByDate(notifications, moment().subtract(7, 'days').format());

	t.is(latestNotifications.length, 1);
	t.is(moment().subtract(5, 'days').format(), latestNotifications[0].updated_at);
});

test('#showNotifications shows notifications', async t => {
	const service = t.context.service;
	const title = 'notification title';
	const repositoryName = 'user/repo';
	const reason = 'subscribed';

	/* eslint-disable camelcase */
	const oldNotifications = [{
		updated_at: moment().subtract(9, 'days').format(),
		repository: {full_name: repositoryName},
		title,
		subject: {title},
		iconUrl: 'icon-notif-128.png',
		contextMessage: Defaults.getNotificationReasonText(reason)
	}, {
		updated_at: moment().subtract(8, 'days').format(),
		repository: {full_name: repositoryName},
		title,
		subject: {title},
		iconUrl: 'icon-notif-128.png',
		contextMessage: Defaults.getNotificationReasonText(reason)
	}];

	const newNotification = [{
		updated_at: moment().subtract(5, 'days').format(),
		repository: {full_name: repositoryName},
		title,
		subject: {title},
		iconUrl: 'icon-notif-128.png',
		contextMessage: Defaults.getNotificationReasonText(reason)
	}];
	/* eslint-enable camelcase */

	const notifications = [...oldNotifications, ...newNotification];

	sandbox.stub(service, 'filterNotificationsByDate').returns(newNotification);

	service.showNotifications(notifications, moment().subtract(7, 'days').format());

	await pImmediate();

	t.true(service.filterNotificationsByDate.calledOnce);
	t.true(window.chrome.notifications.create.calledOnce);
});
