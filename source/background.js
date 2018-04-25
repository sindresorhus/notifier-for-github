import API from './util/api';
import BadgeService from './util/badge';
import NotificationsService from './util/notifications-service';
import PermissionsService from './util/permissions-service';
import PersistenceService from './util/persistence-service';
import TabsService from './util/tabs-service';
import OptionsSync from 'webext-options-sync';
import domainPermissionToggle from 'webext-domain-permission-toggle';
import api from './lib/api';

const {local: localStore} = browser.storage;

new OptionsSync().define({
	defaults: {
		token: '',
		onlyParticipating: false,
		playSound: false,
		showDesktopNotif: false
	},
	migrations: [
		OptionsSync.migrations.removeUnused
	]
});

domainPermissionToggle.addContextMenu();

const options = new OptionsSync().getAll();

const scheduleAlaram = interval => {
	const intervalSetting = localStore.get('interval') || 60;
	const intervalValue = interval || 60;

	if (intervalSetting !== intervalValue) {
		localStore.set('interval', intervalValue);
	}

	// Delay less than 1 minute will cause a warning
	const delayInMinutes = Math.max(Math.ceil(intervalValue / 60), 1);

	browser.alarms.create({delayInMinutes});
};

const handleLastModified = date => {
	const lastModified = localStore.get('lastModified') || new Date(0);

	if (date !== lastModified) {
		localStore.set('lastModified', date);
		const {showDesktopNotif, playSound} = await options;
		if (showDesktopNotif === true || playSound === true) {
			NotificationsService.checkNotifications(lastModified);
		}
	}
}

const handleNotificationsResponse = response => {
	const {count, interval, lastModified} = response;

	scheduleAlaram(interval);
	handleLastModified(lastModified);

	BadgeService.renderCount(count);
}

async function update() {
	if (navigator.onLine) {
		try {
			handleNotificationsResponse(await api.getNotifications());
		} catch (error) {
			handleError(error);
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

function handleBrowserActionClick() {
	const {onlyParticipating} = await options;

	if (onlyParticipating) {
		browser.tabs.create({
			url: `${location.hostname}/notifications`,
			active: true
		});
	} else {
		browser.tabs.create({
			url: `${location.hostname}/notifications/participating`,
			active: true
		});
	}
}

function handleInstalled(details) {
	if (details.reason === 'install') {
		browser.runtime.openOptionsPage();
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

browser.alarms.create({when: Date.now() + 2000});
browser.alarms.onAlarm.addListener(update);
browser.runtime.onMessage.addListener(update);

PermissionsService.queryPermission('notifications').then(granted => {
	if (granted) {
		browser.notifications.onClicked.addListener(id => {
			NotificationsService.openNotification(id);
		});

		browser.notifications.onClosed.addListener(id => {
			NotificationsService.removeNotification(id);
		});
	}
});

browser.runtime.onInstalled.addListener(handleInstalled);
browser.browserAction.onClicked.addListener(handleBrowserActionClick);

update();
