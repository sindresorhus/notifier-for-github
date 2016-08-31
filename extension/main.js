const API = require('./src/api');
const BadgeService = require('./src/badge-service');
const NotificationsService = require('./src/notifications-service');
const PermissionsService = require('./src/permissions-service');
const PersistenceService = require('./src/persistence-service');
const TabsService = require('./src/tabs-service');

function handleInterval(interval) {
	const intervalSetting = parseInt(PersistenceService.get('interval'), 10) || 60;
	const intervalValue = interval || 60;

	if (intervalSetting !== intervalValue) {
		PersistenceService.set('interval', intervalValue);
	}

	// delay less than 1 minute will cause a warning
	const delayInMinutes = Math.max(Math.ceil(intervalValue / 60), 1);

	chrome.alarms.create({delayInMinutes});
}

function handleLastModified(date) {
	let lastModifed = PersistenceService.get('lastModifed');
	const emptyLastModified = String(lastModifed) === 'null' || String(lastModifed) === 'undefined';
	lastModifed = emptyLastModified ? new Date(0) : lastModifed;

	if (date !== lastModifed) {
		PersistenceService.set('lastModifed', date);
		if (PersistenceService.get('showDesktopNotif') === true) {
			NotificationsService.checkNotifications(lastModifed);
		}
	}
}

function handleNotificationsResponse(response) {
	const {count, interval, lastModifed} = response;

	handleInterval(interval);
	handleLastModified(lastModifed);

	BadgeService.renderCount(count);
}

function update() {
	API.getNotifications().then(handleNotificationsResponse).catch(handleError);
}

function handleError(error) {
	BadgeService.renderError(error);
}

function handleBrowserActionClick(tab) {
	const tabUrl = API.getTabUrl();

	// request optional permissions the 1rst time
	if (PersistenceService.get('tabs_permission') === undefined) {
		PermissionsService.requestPermission('tabs').then(granted => {
			PersistenceService.set('tabs_permission', granted);
			TabsService.openTab(tabUrl, tab);
		});
	} else {
		TabsService.openTab(tabUrl, tab);
	}
}

function handleInstalled(details) {
	if (details.reason === 'install') {
		chrome.runtime.openOptionsPage();
	}
}

chrome.alarms.create({when: Date.now() + 2000});
chrome.alarms.onAlarm.addListener(update);
chrome.runtime.onMessage.addListener(update);

PermissionsService.queryPermission('notifications').then(granted => {
	if (granted) {
		chrome.notifications.onClicked.addListener(id => {
			NotificationsService.openNotification(id);
		});

		chrome.notifications.onClosed.addListener(id => {
			NotificationsService.removeNotification(id);
		});
	}
});

chrome.runtime.onInstalled.addListener(handleInstalled);
chrome.browserAction.onClicked.addListener(handleBrowserActionClick);

update();
