import OptionsSync from 'webext-options-sync';
import domainPermissionToggle from 'webext-domain-permission-toggle';
import localStore from './lib/local-store';
import {getNotificationCount, getTabUrl} from './lib/api';
import {openTab} from './lib/tabs-service';
import BadgeService from './lib/badge';
import {checkNotifications, openNotification, removeNotification} from './lib/notifications-service';
import {queryPermission} from './lib/permissions-service';

const syncStore = new OptionsSync();

new OptionsSync().define({
	defaults: {
		token: '',
		rootUrl: 'https://api.github.com/',
		playSound: false,
		showDesktopNotif: false,
		onlyParticipating: false
	},
	migrations: [
		OptionsSync.migrations.removeUnused
	]
});

domainPermissionToggle.addContextMenu();

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

const handleLastModified = async date => {
	const lastModified = localStore.get('lastModified') || new Date(0);

	if (date !== lastModified) {
		localStore.set('lastModified', date);
		const {showDesktopNotif, playSound} = await syncStore.getAll();
		if (showDesktopNotif === true || playSound === true) {
			checkNotifications(lastModified);
		}
	}
};

const handleNotificationsResponse = response => {
	const {count, interval, lastModified} = response;

	scheduleAlaram(interval);
	handleLastModified(lastModified);

	BadgeService.renderCount(count);
};

async function update() {
	if (navigator.onLine) {
		try {
			handleNotificationsResponse(await getNotificationCount());
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

const handleBrowserActionClick = async () => {
	const {onlyParticipating} = await syncStore.getAll();

	if (onlyParticipating) {
		openTab(`${getTabUrl()}notifications`);
	} else {
		openTab(`${getTabUrl()}notifications/participating`);
	}
};

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

(async () => {
	if (await queryPermission('notifications')) {
		browser.notifications.onClicked.addListener(id => {
			openNotification(id);
		});

		browser.notifications.onClosed.addListener(id => {
			removeNotification(id);
		});
	}
})();

browser.runtime.onInstalled.addListener(handleInstalled);
browser.browserAction.onClicked.addListener(handleBrowserActionClick);

update();
