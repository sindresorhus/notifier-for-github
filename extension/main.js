const API = require('./src/api');
const BadgeService = require('./src/badge');
const NotificationsService = require('./src/notifications-service');
const PermissionsService = require('./src/permissions-service');
const PersistenceService = require('./src/persistence-service');
const TabsService = require('./src/tabs-service');

function scheduleAlaram(interval) {
	const intervalSetting = parseInt(PersistenceService.get('interval'), 10) || 60;
	const intervalValue = interval || 60;

	if (intervalSetting !== intervalValue) {
		PersistenceService.set('interval', intervalValue);
	}

	// Delay less than 1 minute will cause a warning
	const delayInMinutes = Math.max(Math.ceil(intervalValue / 60), 1);

	window.chrome.alarms.create({delayInMinutes});
}

function handleLastModified(date) {
	let lastModified = PersistenceService.get('lastModified');
	const emptyLastModified = String(lastModified) === 'null' || String(lastModified) === 'undefined';
	lastModified = emptyLastModified ? new Date(0) : lastModified;

	if (date !== lastModified) {
		PersistenceService.set('lastModified', date);
		if (PersistenceService.get('showDesktopNotif') === true || PersistenceService.get('playSoundNotif') === true) {
			NotificationsService.checkNotifications(lastModified);
		}
	}
}

function handleNotificationsResponse(response) {
	const {count, interval, lastModified} = response;

	scheduleAlaram(interval);
	handleLastModified(lastModified);

	BadgeService.renderCount(count);
}

async function update() {
	if (navigator.onLine) {
		try {
			const notifications = await API.getNotifications();
			handleNotificationsResponse(notifications);
		} catch (err) {
			handleError(err);
		}
	} else {
		handleOfflineStatus();
	}
}

function handleError(error) {
	scheduleAlaram();

	BadgeService.renderError(error);
}

function handleOfflineStatus() {
	BadgeService.renderWarning('offline');
}

async function handleBrowserActionClick(tab) {
	const tabUrl = API.getTabUrl();

	// Request optional permissions the 1rst time
	if (PersistenceService.get('tabs_permission') === undefined) {
		try {
			const granted = await PermissionsService.requestPermission('tabs');
			PersistenceService.set('tabs_permission', granted);
			TabsService.openTab(tabUrl, tab);
		} catch (err) {
			handleError(err);
		}
	} else {
		TabsService.openTab(tabUrl, tab);
	}
}

function handleInstalled(details) {
	if (details.reason === 'install') {
		window.chrome.runtime.openOptionsPage();
	}
}

function handleConnectionStatus(event) {
	if (event.type === 'online') {
		update();
	} else if (event.type === 'offline') {
		handleOfflineStatus();
	}
}

window.addEventListener('online', handleConnectionStatus);
window.addEventListener('offline', handleConnectionStatus);

window.chrome.alarms.create({when: Date.now() + 2000});
window.chrome.alarms.onAlarm.addListener(update);
window.chrome.runtime.onMessage.addListener(update);
(async () => {
	try {
		const granted = await PermissionsService.queryPermission('notifications');
		if (granted) {
			window.chrome.notifications.onClicked.addListener(id => {
				NotificationsService.openNotification(id);
			});

			window.chrome.notifications.onClosed.addListener(id => {
				NotificationsService.removeNotification(id);
			});
		}
	} catch (err) {
		handleError(err);
	}
})();
window.chrome.runtime.onInstalled.addListener(handleInstalled);
window.chrome.browserAction.onClicked.addListener(handleBrowserActionClick);

update();
