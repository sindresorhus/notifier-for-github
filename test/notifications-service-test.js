import test from 'ava';
import sinon from 'sinon';
import moment from 'moment';

import * as notifications from '../source/lib/notifications-service';
import {getNotificationReasonText} from '../source/lib/defaults';
import {fakeFetch} from './util';

test.beforeEach(t => {
	t.context.service = Object.assign({}, notifications);
	t.context.notificationId = (Math.random() * 1000 | 0).toString();
	t.context.notificationUrl = `https://api.github.com/notifications/${t.context.notificationId}`;
	t.context.notificationsUrl = 'https://github.com/user/notifications';
	t.context.notificationHtmlUrl = `https://github.com/user/repo/issues/${t.context.notificationId}`;

	t.context.defaultResponse = {
		body: {
			// eslint-disable-next-line camelcase
			html_url: t.context.notificationHtmlUrl
		}
	};

	global.fetch = fakeFetch(t.context.defaultResponse);

	browser.storage.local.get = sinon.stub().resolves({});
	browser.storage.local.remove = sinon.spy();
	browser.storage.local.get.withArgs(t.context.notificationId)
		.resolves({
			[t.context.notificationId]: t.context.notificationsUrl
		});

	browser.tabs.query = sinon.stub().resolves([]);
	browser.tabs.create = sinon.stub().resolves(true);

	browser.notifications.create = sinon.stub().resolves(t.context.notificationId);
	browser.notifications.clear = sinon.stub().resolves(true);

	browser.permissions.contains = sinon.stub().yieldsAsync(true);

	browser.storage.sync.set({
		options: {
			token: 'a1b2c3d4e5f6g7h8i9j0a1b2c3d4e5f6g7h8i9j0',
			rootUrl: 'https://api.github.com/',
			playNotifSound: true,
			showDesktopNotif: true
		}
	});
});

test.serial('#openNotification gets notification url by notificationId from local-store', async t => {
	const {service, notificationId} = t.context;

	await service.openNotification(notificationId);

	t.true(browser.storage.local.get.calledWith(notificationId));
});

test.serial('#openNotification clears notification from queue by notificationId', async t => {
	const {service, notificationId} = t.context;

	await service.openNotification(notificationId);

	t.true(browser.notifications.clear.calledWithMatch(notificationId));
});

test.serial('#openNotification skips network requests if no url returned by local-store', async t => {
	const {service} = t.context;

	await service.openNotification('random-notification-id');

	t.is(global.fetch.callCount, 0);
});

test.serial('#openNotification closes notification if no url returned by local-store', async t => {
	const {service} = t.context;

	await service.openNotification('random-notification-id');

	t.is(browser.notifications.clear.callCount, 1);
});

test.serial('#openNotification opens tab with url from network response', async t => {
	const {service, notificationId, notificationHtmlUrl} = t.context;

	await service.openNotification(notificationId);

	t.true(browser.tabs.create.calledWith({url: notificationHtmlUrl}));
});

test.serial('#openNotification closes notification on error', async t => {
	const {service, notificationId} = t.context;

	global.fetch = sinon.stub().rejects('error');

	await service.openNotification(notificationId);

	t.true(browser.notifications.clear.calledWith(notificationId));
});

test.serial('#openNotification opens nofifications tab on error', async t => {
	const {service, notificationId} = t.context;

	global.fetch = sinon.stub().rejects('error');

	await service.openNotification(notificationId);

	t.true(browser.tabs.create.calledWith({url: 'https://github.com/notifications'}));
});

test.serial('#closeNotification returns promise and clears notifications by id', async t => {
	const {service, notificationId} = t.context;

	await service.closeNotification(notificationId);

	t.true(browser.notifications.clear.calledWith(notificationId));
});

test.serial('#removeNotification removes notifications from storage', async t => {
	const {service, notificationId} = t.context;

	await service.removeNotification(notificationId);

	t.true(browser.storage.local.remove.calledWith(notificationId));
});

test.serial('#getNotificationObject returns Notification object made via options and Defaults method call', t => {
	const {service} = t.context;

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
		iconUrl: 'icon-notif.png',
		contextMessage: getNotificationReasonText(reason)
	});
});

test.serial('#filterNotificationsByDate filters latest notifications', t => {
	const {service} = t.context;
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

test.serial('#showNotifications shows notifications', t => {
	const {service} = t.context;
	/* eslint-disable camelcase */
	const title = 'notification title';
	const repositoryName = 'user/repo';
	const reason = 'subscribed';

	const oldNotifications = [{
		updated_at: moment().subtract(9, 'days').format(),
		repository: {full_name: repositoryName},
		title,
		subject: {title},
		iconUrl: 'icon-notif.png',
		contextMessage: getNotificationReasonText(reason)
	}, {
		updated_at: moment().subtract(8, 'days').format(),
		repository: {full_name: repositoryName},
		title,
		subject: {title},
		iconUrl: 'icon-notif.png',
		contextMessage: getNotificationReasonText(reason)
	}];

	const newNotification = [{
		updated_at: moment().subtract(5, 'days').format(),
		repository: {full_name: repositoryName},
		title,
		subject: {title},
		iconUrl: 'icon-notif.png',
		contextMessage: getNotificationReasonText(reason)
	}];
	/* eslint-enable camelcase */

	const notifications = oldNotifications.concat(newNotification);

	service.showNotifications(notifications, moment().subtract(7, 'days').format());

	t.true(browser.notifications.create.called);
	t.is(browser.notifications.create.callCount, 1);
});

test.serial('#playNotification plays notification sound', async t => {
	const {service} = t.context;

	/* eslint-disable camelcase */
	const notifications = [{
		updated_at: moment().subtract(9, 'days').format()
	}];
	/* eslint-enable camelcase */

	browser.extension = sinon.stub();
	browser.extension.getURL = sinon.stub();

	global.Audio = sinon.stub();
	global.Audio.prototype.play = sinon.stub();

	await service.playNotification(notifications, moment().subtract(10, 'days').format());

	t.true(global.Audio.calledOnce);
	t.true(global.Audio.prototype.play.calledOnce);
});
