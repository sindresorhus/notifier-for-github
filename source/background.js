import OptionsSync from 'webext-options-sync';
import localStore from './lib/local-store';
import {openTab} from './lib/tabs-service';
import {queryPermission} from './lib/permissions-service';
import {getNotificationCount, getTabUrl} from './lib/api';
import {renderCount, renderError, renderWarning} from './lib/badge';
import {checkNotifications, openNotification} from './lib/notifications-service';

const syncStore = new OptionsSync();

new OptionsSync().define({
	defaults: {
		token: '',
		rootUrl: 'https://api.github.com/',
		playNotifSound: false,
		showDesktopNotif: false,
		onlyParticipating: false,
		newTabAlways: false
	},
	migrations: [
		OptionsSync.migrations.removeUnused
	]
});

function scheduleNextAlarm(interval) {
	const intervalSetting = localStore.get('interval') || 60;
	const intervalValue = interval || 60;

	if (intervalSetting !== intervalValue) {
		localStore.set('interval', intervalValue);
	}

	// Delay less than 1 minute will cause a warning
	const delayInMinutes = Math.max(Math.ceil(intervalValue / 60), 1);

	browser.alarms.create({delayInMinutes});
}

async function handleLastModified(newLastModified) {
	const lastModified = await localStore.get('lastModified') || new Date(0);

	// Something has changed since we last accessed, display any new notificaitons
	if (newLastModified !== lastModified) {
		const {showDesktopNotif, playNotifSound} = await syncStore.getAll();
		if (showDesktopNotif === true || playNotifSound === true) {
			await checkNotifications(lastModified);
		}

		await localStore.set('lastModified', newLastModified);
	}
}

async function updateNotificationCount() {
	const response = await getNotificationCount();
	const {count, interval, lastModified} = response;

	renderCount(count);
	scheduleNextAlarm(interval);
	handleLastModified(lastModified);
}

function handleError(error) {
	scheduleNextAlarm();

	renderError(error);
}

function handleOfflineStatus() {
	renderWarning('offline');
}

async function update() {
	if (navigator.onLine) {
		try {
			updateNotificationCount();
		} catch (error) {
			handleError(error);
		}
	} else {
		handleOfflineStatus();
	}
}

async function handleBrowserActionClick() {
	await openTab(await getTabUrl());
}

function handleInstalled(details) {
	if (details.reason === 'install') {
		browser.runtime.openOptionsPage();
	}
}

function handleConnectionStatus() {
	if (navigator.onLine) {
		update();
	} else {
		handleOfflineStatus();
	}
}

function onMessage(message) {
	if (message === 'update') {
		update();
	}
}

async function addNotificationHandler() {
	if (await queryPermission('notifications')) {
		browser.notifications.onClicked.addListener(id => {
			openNotification(id);
		});
	}
}

function init() {
	window.addEventListener('online', handleConnectionStatus);
	window.addEventListener('offline', handleConnectionStatus);

	browser.alarms.onAlarm.addListener(update);
	browser.alarms.create({when: Date.now() + 2000});

	browser.runtime.onMessage.addListener(onMessage);
	browser.runtime.onInstalled.addListener(handleInstalled);

	browser.permissions.onAdded.addListener(addNotificationHandler);

	browser.browserAction.onClicked.addListener(handleBrowserActionClick);

	addNotificationHandler();
	update();
}

init();
