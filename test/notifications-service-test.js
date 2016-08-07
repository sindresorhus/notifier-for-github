import test from 'ava';
import sinon from 'sinon';
import moment from 'moment';
import utils from './utils';

global.window = utils.setupWindow();
require('../extension/src/api.js');
require('../extension/src/defaults-service.js');
require('../extension/src/persistence-service.js');
require('../extension/src/network-service.js');
require('../extension/src/permissions-service.js');
require('../extension/src/tabs-service.js');
require('../extension/src/notifications-service.js');

test.beforeEach(t => {
	t.context.defaults = new global.window.DefaultsService();
	t.context.persistence = new global.window.PersistenceService(t.context.defaults);
	t.context.permissions = new global.window.PermissionsService(t.context.persistence);
	t.context.networking = new global.window.NetworkService(t.context.persistence);
	t.context.tabs = new global.window.TabsService(t.context.permissions);
	t.context.api = new global.window.API(t.context.persistence, t.context.networking, t.context.defaults);
	t.context.notificationId = (Math.random() * 1000 | 0).toString();
	t.context.notificationUrl = `https://api.github.com/notifications/${t.context.notificationId}`;
	t.context.notificationsUrl = 'https://github.com/user/notifications';
	t.context.notificationHtmlUrl = `https://github.com/user/repo/issues/${t.context.notificationId}`;
	global.window.fetch = sinon.stub().returns(Promise.resolve(''));
	global.window.chrome.notifications.clear = sinon.stub().yieldsAsync();
	global.window.chrome.notifications.create = sinon.stub();

	const defaultResponse = {
		json() {
			return {
				/* eslint-disable camelcase */
				html_url: t.context.notificationHtmlUrl
				/* eslint-enable camelcase */
			};
		}
	};
	t.context.api.makeApiRequest = sinon.stub().returns(Promise.resolve(defaultResponse));
	t.context.tabs.openTab = sinon.stub().returns(Promise.resolve({}));
});

test('installs NotificationsService constructor', t => {
	t.is(typeof global.window.NotificationsService, 'function');
});

test('NotificationsService constructor sets its deps', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	t.true(service.PersistenceService instanceof global.window.PersistenceService);
	t.true(service.API instanceof global.window.API);
	t.true(service.DefaultsService instanceof global.window.DefaultsService);
	t.true(service.TabsService instanceof global.window.TabsService);
});

test('#openNotification gets notification url by notificationId from PersistenceService', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	service.PersistenceService.get = sinon.stub().withArgs(t.context.notificationId).returns(t.context.notificationUrl);

	return service.openNotification(t.context.notificationId).then(() => {
		t.deepEqual(service.PersistenceService.get.firstCall.args, [t.context.notificationId]);
	});
});

test('#openNotification clears notification notificationId', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	service.PersistenceService.get = sinon.stub().withArgs(t.context.notificationId).returns(t.context.notificationUrl);

	return service.openNotification(t.context.notificationId).then(() => {
		t.true(global.window.chrome.notifications.clear.calledWithMatch(t.context.notificationId));
	});
});

test('#openNotification skips network requests if no url returned by PersistenceService', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	service.PersistenceService.get = sinon.stub().returns(null);

	return service.openNotification(t.context.notificationId).then(() => {
		t.is(service.API.makeApiRequest.callCount, 0);
	});
});

test('#openNotification closes notification if no url returned by PersistenceService', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	service.PersistenceService.get = sinon.stub().returns(null);
	service.closeNotification = sinon.stub().returns(Promise.resolve());

	return service.openNotification(t.context.notificationId).then(() => {
		t.is(service.closeNotification.callCount, 1);
	});
});

test('#openNotification opens tab with url from network response', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	service.PersistenceService.get = sinon.stub().returns(t.context.notificationUrl);

	return service.openNotification(t.context.notificationId).then(() => {
		t.deepEqual(service.TabsService.openTab.lastCall.args, [t.context.notificationHtmlUrl]);
	});
});

test('#openNotification closes notification on error', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	service.PersistenceService.get = sinon.stub().returns(t.context.notificationUrl);
	t.context.api.makeApiRequest = sinon.stub().returns(Promise.reject('error'));

	service.closeNotification = sinon.spy();

	return service.openNotification(t.context.notificationId).then(() => {
		t.deepEqual(service.closeNotification.lastCall.args, [t.context.notificationId]);
	});
});

test('#openNotification opens nofifications tab on error', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	service.PersistenceService.get = sinon.stub().returns(t.context.notificationUrl);
	t.context.api.makeApiRequest = sinon.stub().returns(Promise.reject('error'));
	t.context.api.getTabUrl = sinon.stub().returns(t.context.notificationsUrl);

	return service.openNotification(t.context.notificationId).then(() => {
		t.true(t.context.tabs.openTab.calledWithMatch(t.context.notificationsUrl));
	});
});

test.serial('#closeNotification returns promise and clears notifications by id', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	const id = t.context.notificationId;

	return service.closeNotification(id).then(() => {
		t.true(global.window.chrome.notifications.clear.calledWithMatch(id));
	});
});

test('#removeNotification removes notifications from storage', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	service.PersistenceService.remove = sinon.spy();
	service.removeNotification(t.context.notificationId);
	t.true(service.PersistenceService.remove.calledWith(t.context.notificationId));
});

test('#checkNotifications makes API request and shows notifications', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	const response = {
		json() {
			return [];
		}
	};

	t.context.api.makeApiRequest = sinon.stub().returns(Promise.resolve(response));
	service.showNotifications = sinon.stub();

	return service.checkNotifications().then(() => {
		t.true(t.context.api.makeApiRequest.calledWith({perPage: 100}));
		t.true(service.showNotifications.calledWith([]));
	});
});

test('#getNotificationObject returns Notification object made via options and DefaultsService call', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	const title = 'notification title';
	const repositoryName = 'user/repo';
	const reason = 'subscribed';
	const notification = service.getNotificationObject({
		/* eslint-disable camelcase */
		subject: {title},
		repository: {full_name: repositoryName},
		reason
		/* eslint-enable camelcase */
	});

	t.deepEqual(notification, {
		title,
		message: repositoryName,
		type: 'basic',
		iconUrl: 'icon-notif-128.png',
		contextMessage: t.context.defaults.getNotificationReasonText(reason)
	});
});

test('#filterNotificationsByDate filters latest notifications', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
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

test('#showNotifications shows notifications', t => {
	const service = new global.window.NotificationsService(t.context.persistence, t.context.api, t.context.defaults, t.context.tabs);
	/* eslint-disable camelcase */
	const title = 'notification title';
	const repositoryName = 'user/repo';
	const reason = 'subscribed';
	const notifications = [{
		updated_at: moment().subtract(9, 'days').format(),
		repository: {full_name: repositoryName},
		title,
		subject: {title},
		iconUrl: 'icon-notif-128.png',
		contextMessage: t.context.defaults.getNotificationReasonText(reason)
	}, {
		updated_at: moment().subtract(8, 'days').format(),
		repository: {full_name: repositoryName},
		title,
		subject: {title},
		iconUrl: 'icon-notif-128.png',
		contextMessage: t.context.defaults.getNotificationReasonText(reason)
	}, {
		updated_at: moment().subtract(5, 'days').format(),
		repository: {full_name: repositoryName},
		title,
		subject: {title},
		iconUrl: 'icon-notif-128.png',
		contextMessage: t.context.defaults.getNotificationReasonText(reason)
	}];
	/* eslint-enable camelcase */
	sinon.spy(service, 'filterNotificationsByDate');

	service.showNotifications(notifications, moment().subtract(7, 'days').format());
	t.true(service.filterNotificationsByDate.called);
	t.true(global.window.chrome.notifications.create.called);
	t.is(global.window.chrome.notifications.create.callCount, 1);
});
