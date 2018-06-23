import OptionsSync from 'webext-options-sync';
import localStore from './lib/local-store';
import {openTab} from './lib/tabs-service';
import {queryPermission, requestPermission} from './lib/permissions-service';
import {getNotificationCount, getTabUrl} from './lib/api';
import {renderCount, renderError, renderWarning} from './lib/badge';
import {checkNotifications, openNotification, removeNotification} from './lib/notifications-service';

const syncStore = new OptionsSync();

new OptionsSync().define({
	defaults: {
		token: '',
		rootUrl: 'https://api.github.com/',
		playNotifSound: false,
		showDesktopNotif: false,
		onlyParticipating: false
	},
	migrations: [
		OptionsSync.migrations.removeUnused
	]
});

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
	const lastModified = await localStore.get('lastModified') || new Date(0);

	if (date !== lastModified) {
		localStore.set('lastModified', date);
		const {showDesktopNotif, playNotifSound} = await syncStore.getAll();
		if (showDesktopNotif === true || playNotifSound === true) {
			checkNotifications(lastModified);
		}
	}
};

const handleNotificationsResponse = response => {
	const {count, interval, lastModified} = response;

	scheduleAlaram(interval);
	handleLastModified(lastModified);

	renderCount(count);
};

const handleError = error => {
	scheduleAlaram();

	renderError(error);
};

const handleOfflineStatus = () => {
	renderWarning('offline');
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

const handleBrowserActionClick = async () => {
	const alreadyGranted = await queryPermission('tabs');

	if (!alreadyGranted) {
		try {
			const granted = await requestPermission('tabs');
			if (!granted) {
				return;
			}
		} catch (error) {
			return;
		}
	}

	await openTab(await getTabUrl());
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
browser.runtime.onMessage.addListener(message => {
	if (message === 'update') {
		update();
	}
});

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
