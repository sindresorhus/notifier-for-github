const API = require('./src/api');
const BadgeService = require('./src/badge');
const NotificationsService = require('./src/notifications-service');
const PermissionsService = require('./src/permissions-service');
const PersistenceService = require('./src/persistence-service');
const TabsService = require('./src/tabs-service');

async function scheduleAlaram(interval) {
	const intervalSetting = await PersistenceService.get('interval');
	const intervalValue = interval || 60;

	if (intervalSetting !== intervalValue) {
		await PersistenceService.set('interval', intervalValue);
	}

	// Delay less than 1 minute will cause a warning
	const delayInMinutes = Math.max(Math.ceil(intervalValue / 60), 1);

	window.chrome.alarms.create({delayInMinutes});
}

async function handleLastModified(date) {
	let lastModified = await PersistenceService.get('lastModified');
	const emptyLastModified = String(lastModified) === 'null' || String(lastModified) === 'undefined';
	lastModified = emptyLastModified ? new Date(0) : lastModified;

	if (date !== lastModified) {
		await PersistenceService.set('lastModified', date);
		const showDesktopNotif = await PersistenceService.get('showDesktopNotif');
		if (showDesktopNotif) {
			NotificationsService.checkNotifications(lastModified);
		}
	}
}

async function handleNotificationsResponse(response) {
	const {count, interval, lastModified} = response;

	await scheduleAlaram(interval);
	await handleLastModified(lastModified);

	BadgeService.renderCount(count);
}

async function update() {
	if (!navigator.onLine) {
		return handleOfflineStatus();
	}
	try {
		const response = await API.getNotifications();
		handleNotificationsResponse(response);
	} catch (err) {
		handleError(err);
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
	const tabUrl = await API.getTabUrl();

	// request optional permissions the 1rst time
	const tabsAlreadyGranted = await PersistenceService.get('tabs_permission');
	if (tabsAlreadyGranted === undefined) {
		const granted = await PermissionsService.requestPermission('tabs');
		await PersistenceService.set('tabs_permission', granted);
	}
	await TabsService.openTab(tabUrl, tab);
}

function handleInstalled(details) {
	if (details.reason === 'install') {
		window.chrome.runtime.openOptionsPage();
	}
}

function handleConnectionStatus(event) {
	if (event.type === 'online') {
		scheduleAlaram();
	} else if (event.type === 'offline') {
		handleOfflineStatus();
	}
}

window.addEventListener('online', handleConnectionStatus);
window.addEventListener('offline', handleConnectionStatus);

window.chrome.alarms.create({when: Date.now() + 2000});
window.chrome.alarms.onAlarm.addListener(update);
window.chrome.runtime.onMessage.addListener(update);

checkDesktopNotificationsPermission();

window.chrome.runtime.onInstalled.addListener(handleInstalled);
window.chrome.browserAction.onClicked.addListener(handleBrowserActionClick);

update();
