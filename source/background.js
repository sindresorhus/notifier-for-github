import browser from 'webextension-polyfill';
import delay from 'delay';
import optionsStorage from './options-storage.js';
import localStore from './lib/local-store.js';
import {openTab} from './lib/tabs-service.js';
import {queryPermission} from './lib/permissions-service.js';
import {getNotificationCount, getTabUrl} from './lib/api.js';
import {renderCount, renderError, renderWarning} from './lib/badge.js';
import {checkNotifications, openNotification} from './lib/notifications-service.js';
import {isChrome, isNotificationTargetPage} from './util.js';

async function scheduleNextAlarm(interval) {
	const intervalSetting = await localStore.get('interval') || 60;
	const intervalValue = interval || 60;

	if (intervalSetting !== intervalValue) {
		localStore.set('interval', intervalValue);
	}

	// Delay less than 1 minute will cause a warning
	const delayInMinutes = Math.max(Math.ceil(intervalValue / 60), 1);

	browser.alarms.clearAll();
	browser.alarms.create('update', {delayInMinutes});
}

async function handleLastModified(newLastModified) {
	const lastModified = await localStore.get('lastModified') || new Date(0).toUTCString();

	// Something has changed since we last accessed, display any new notifications
	if (newLastModified !== lastModified) {
		const {showDesktopNotif, playNotifSound} = await optionsStorage.getAll();
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
	scheduleNextAlarm();
	renderWarning('offline');
}

async function update() {
	if (navigator.onLine) {
		try {
			await updateNotificationCount();
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

async function onMessage(message) {
	if (message.action === 'update') {
		await addHandlers();
		await update();
	}
}

async function onTabUpdated(tabId, changeInfo, tab) {
	if (changeInfo.status !== 'complete') {
		return;
	}

	if (await isNotificationTargetPage(tab.url)) {
		await delay(1000);
		await update();
	}
}

function onNotificationClick(id) {
	openNotification(id);
}

async function createOffscreenDocument() {
	if (await browser.offscreen.hasDocument()) {
		return;
	}

	await browser.offscreen.createDocument({
		url: 'offscreen.html',
		reasons: ['AUDIO_PLAYBACK'],
		justification: 'To play an audio chime indicating notifications'
	});
}

async function addHandlers() {
	const {updateCountOnNavigation} = await optionsStorage.getAll();

	if (await queryPermission('notifications')) {
		browser.notifications.onClicked.addListener(onNotificationClick);
	}

	if (await queryPermission('tabs')) {
		if (updateCountOnNavigation) {
			browser.tabs.onUpdated.addListener(onTabUpdated);
		} else {
			browser.tabs.onUpdated.removeListener(onTabUpdated);
		}
	}
}

async function init() {
	browser.alarms.onAlarm.addListener(update);
	scheduleNextAlarm();

	browser.runtime.onMessage.addListener(onMessage);
	browser.runtime.onInstalled.addListener(handleInstalled);

	// Chrome specific API
	if (isChrome(navigator.userAgent)) {
		browser.permissions.onAdded.addListener(addHandlers);
	}

	browser.action.onClicked.addListener(handleBrowserActionClick);

	await createOffscreenDocument();
	addHandlers();
	update();
}

init();
