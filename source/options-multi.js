import browser from 'webextension-polyfill';
import optionsStorage from './options-storage.js';
import {
	getInstances,
	saveInstances,
	addInstance,
	updateInstance,
	deleteInstance,
	getInstance
} from './lib/instances-storage.js';
import {requestPermission} from './lib/permissions-service.js';
import {getNotifications} from './lib/api-multi.js';
import {getAccountColorCss} from './lib/badge.js';
import {parseFullName} from './util.js';
import repositoriesStorage from './repositories-storage.js';

// Views
const singleView = document.querySelector('#single-view');
const multiView = document.querySelector('#multi-view');

// Single view elements
const singleIdInput = document.querySelector('#single-id');
const singleUrlInput = document.querySelector('#single-url');
const singleTokenInput = document.querySelector('#single-token');
const singleParticipatingInput = document.querySelector('#single-participating');
const singleDesktopNotifInput = document.querySelector('#single-desktop-notif');
const singleNotifSoundInput = document.querySelector('#single-notif-sound');
const singleFilterNotifInput = document.querySelector('#single-filter-notif');
const singleTokenLink = document.querySelector('#single-token-link');
const singleTokenLinkPrivate = document.querySelector('#single-token-link-private');

const singleFields = [
	singleUrlInput,
	singleTokenInput,
	singleParticipatingInput,
	singleDesktopNotifInput,
	singleNotifSoundInput,
	singleFilterNotifInput
];

// Multi view elements
const instancesList = document.querySelector('#instances-list');
const addInstanceButton = document.querySelector('#add-instance');
const instanceEditor = document.querySelector('#instance-editor');
const reposModal = document.querySelector('#repos-modal');

const editorTitle = document.querySelector('#editor-title');
const instanceIdInput = document.querySelector('#instance-id');
const instanceNameInput = document.querySelector('#instance-name');
const instanceUrlInput = document.querySelector('#instance-url');
const instanceTokenInput = document.querySelector('#instance-token');
const instanceEnabledInput = document.querySelector('#instance-enabled');
const instanceParticipatingInput = document.querySelector('#instance-participating');
const instanceDesktopNotifInput = document.querySelector('#instance-desktop-notif');
const instanceNotifSoundInput = document.querySelector('#instance-notif-sound');
const instanceFilterNotifInput = document.querySelector('#instance-filter-notif');
const tokenLink = document.querySelector('#token-link');

const multiFields = [
	instanceNameInput,
	instanceUrlInput,
	instanceTokenInput,
	instanceEnabledInput,
	instanceParticipatingInput,
	instanceDesktopNotifInput,
	instanceNotifSoundInput,
	instanceFilterNotifInput
];

let saveTimer = null;
function debouncedSaveSingle() {
	clearTimeout(saveTimer);
	saveTimer = setTimeout(saveSingleInstance, 400);
}

function debouncedSaveMulti() {
	clearTimeout(saveTimer);
	saveTimer = setTimeout(saveCurrentInstance, 400);
}

let statusTimer = null;
function showStatus(elementId, message, type = 'success') {
	clearTimeout(statusTimer);
	const element = document.querySelector(`#${elementId}`);
	element.textContent = message;
	element.className = `status-message ${type}`;
	element.classList.remove('hidden');
	statusTimer = setTimeout(() => {
		element.classList.add('hidden');
	}, 3000);
}

async function init() {
	setupEventListeners();
	await renderView();
	await optionsStorage.syncForm('#global-settings');
}

async function renderView() {
	const instances = await getInstances();

	if (instances.length <= 1) {
		showSingleView(instances[0]);
	} else {
		showMultiView(instances);
	}
}

// --- Single view ---

function showSingleView(instance) {
	singleView.classList.remove('hidden');
	multiView.classList.add('hidden');

	if (instance) {
		singleIdInput.value = instance.id;
		singleUrlInput.value = instance.rootUrl;
		singleTokenInput.value = instance.token;
		singleParticipatingInput.checked = instance.onlyParticipating;
		singleDesktopNotifInput.checked = instance.showDesktopNotif;
		singleNotifSoundInput.checked = instance.playNotifSound;
		singleFilterNotifInput.checked = instance.filterNotifications;
	} else {
		singleIdInput.value = '';
		singleUrlInput.value = 'https://github.com/';
		singleTokenInput.value = '';
		singleParticipatingInput.checked = false;
		singleDesktopNotifInput.checked = false;
		singleNotifSoundInput.checked = false;
		singleFilterNotifInput.checked = false;
	}

	updateSingleTokenLink();
}

function isPublicGitHub(rootUrl) {
	try {
		const {hostname} = new URL(rootUrl);
		return hostname === 'github.com' || hostname.endsWith('.github.com');
	} catch {
		return false;
	}
}

async function requestHostPermissionIfNeeded(rootUrl) {
	if (!rootUrl || isPublicGitHub(rootUrl)) {
		return true;
	}

	try {
		const {origin} = new URL(rootUrl);
		return browser.permissions.request({origins: [`${origin}/*`]});
	} catch {
		return false;
	}
}

function buildTokenHref(rootUrl = 'https://github.com/', scopes = 'notifications') {
	if (isPublicGitHub(rootUrl)) {
		return `https://github.com/settings/tokens/new?scopes=${scopes}&description=Notifier for GitHub extension`;
	}

	try {
		const urlObject = new URL(rootUrl);
		return `${urlObject.origin}/settings/tokens/new`;
	} catch {
		return '#';
	}
}

function updateSingleTokenLink() {
	const url = singleUrlInput.value;
	singleTokenLink.href = buildTokenHref(url);
	singleTokenLinkPrivate.href = buildTokenHref(url, 'notifications,repo');
}

async function saveSingleInstance() {
	const rootUrl = singleUrlInput.value || 'https://github.com/';
	await requestHostPermissionIfNeeded(rootUrl);
	const data = {
		name: isPublicGitHub(rootUrl) ? 'GitHub' : 'GitHub Enterprise',
		rootUrl,
		token: singleTokenInput.value,
		enabled: true,
		onlyParticipating: singleParticipatingInput.checked,
		showDesktopNotif: singleDesktopNotifInput.checked,
		playNotifSound: singleNotifSoundInput.checked,
		filterNotifications: singleFilterNotifInput.checked
	};

	try {
		if (singleIdInput.value) {
			await updateInstance(singleIdInput.value, data);
		} else {
			const instance = await addInstance(data);
			singleIdInput.value = instance.id;
		}

		showStatus('single-status', 'Saved');
		browser.runtime.sendMessage({action: 'update'});
	} catch (error) {
		showStatus('single-status', error.message, 'error');
	}
}

function requestSwitchToMultiView() {
	showConfirmBanner('Add a second GitHub instance?', switchToMultiView);
}

async function switchToMultiView() {
	if (!singleIdInput.value && singleTokenInput.value) {
		await saveSingleInstance();
	}

	const instances = await getInstances();
	showMultiView(instances);
	openNewEditor();
}

// --- Multi view ---

function showMultiView(instances) {
	singleView.classList.add('hidden');
	multiView.classList.remove('hidden');
	loadInstancesList(instances);
}

function loadInstancesList(instances) {
	instancesList.innerHTML = '';

	for (const instance of instances) {
		const element = createInstanceElement(instance);
		instancesList.append(element);
	}
}

function createInstanceElement(instance) {
	const colorIndex = instance.colorIndex ?? 0;
	const div = document.createElement('div');
	div.className = `instance-item ${instance.enabled ? '' : 'disabled'}`;
	div.dataset.instanceId = instance.id;

	const isEditing = instanceIdInput.value === instance.id && !instanceEditor.classList.contains('hidden');

	div.innerHTML = `
		<div class="instance-info">
			<div class="instance-name"></div>
			<div class="instance-url"></div>
		</div>
		<div class="instance-actions">
			${instance.filterNotifications ? '<button class="button small filter-repos">Filter Repos</button>' : ''}
			<button class="button small edit-instance">${isEditing ? 'Done' : 'Edit'}</button>
			<button class="button danger small delete-instance">Delete</button>
		</div>
	`;

	const nameElement = div.querySelector('.instance-name');
	const dot = document.createElement('span');
	dot.className = 'instance-color-dot';
	dot.style.background = getAccountColorCss(colorIndex);
	const nameText = document.createElement('span');
	nameText.className = 'instance-name-text';
	nameText.textContent = instance.name || '(unnamed)';
	nameElement.append(dot, nameText);
	if (instance.notificationCount > 0) {
		const badge = document.createElement('span');
		badge.className = 'instance-badge count';
		badge.textContent = instance.notificationCount;
		badge.style.background = getAccountColorCss(colorIndex);
		nameElement.append(badge);
	}

	div.querySelector('.instance-url').textContent = instance.rootUrl;

	return div;
}

function handleInstanceListClick(event) {
	const item = event.target.closest('.instance-item');
	const id = item?.dataset.instanceId;
	if (!id) {
		return;
	}

	if (event.target.closest('.edit-instance')) {
		toggleEditor(id);
	} else if (event.target.closest('.delete-instance')) {
		confirmDeleteInstance(id);
	} else if (event.target.closest('.filter-repos')) {
		showReposFilter(id);
	}
}

function addNewInstance() {
	openNewEditor();
}

function openNewEditor() {
	instanceIdInput.value = '';
	editorTitle.textContent = 'New Instance';
	instanceNameInput.value = '';
	instanceUrlInput.value = 'https://github.com/';
	instanceTokenInput.value = '';
	instanceEnabledInput.checked = true;
	instanceParticipatingInput.checked = false;
	instanceDesktopNotifInput.checked = false;
	instanceNotifSoundInput.checked = false;
	instanceFilterNotifInput.checked = false;

	updateTokenLink();
	updateEnabledLabel();
	instanceEditor.classList.remove('hidden');

	updateEditButtons();
	instanceEditor.scrollIntoView({behavior: 'smooth'});
}

function toggleEditor(id) {
	const isOpen = !instanceEditor.classList.contains('hidden');
	const isSameInstance = instanceIdInput.value === id;

	if (isOpen && isSameInstance) {
		closeEditor();
		return;
	}

	openEditor(id);
}

async function openEditor(id) {
	const instance = await getInstance(id);
	if (!instance) {
		return;
	}

	instanceIdInput.value = instance.id;
	editorTitle.textContent = instance.name || 'New Instance';
	updateEditorColor(instance.colorIndex ?? 0);
	instanceNameInput.value = instance.name;
	instanceUrlInput.value = instance.rootUrl;
	instanceTokenInput.value = instance.token;
	instanceEnabledInput.checked = instance.enabled;
	instanceParticipatingInput.checked = instance.onlyParticipating;
	instanceDesktopNotifInput.checked = instance.showDesktopNotif;
	instanceNotifSoundInput.checked = instance.playNotifSound;
	instanceFilterNotifInput.checked = instance.filterNotifications;

	updateTokenLink();
	updateEnabledLabel();
	instanceEditor.classList.remove('hidden');

	updateEditButtons();
	instanceEditor.scrollIntoView({behavior: 'smooth'});
}

function closeEditor() {
	instanceEditor.classList.add('hidden');
	instanceIdInput.value = '';
	updateEditButtons();
}

function updateEditButtons() {
	for (const button of instancesList.querySelectorAll('.edit-instance')) {
		const item = button.closest('.instance-item');
		const isEditing = item.dataset.instanceId === instanceIdInput.value && !instanceEditor.classList.contains('hidden');
		button.textContent = isEditing ? 'Done' : 'Edit';
	}
}

function updateEnabledLabel() {
	document.querySelector('.toggle-text').textContent = instanceEnabledInput.checked ? 'Enabled' : 'Disabled';
}

function updateEditorColor(colorIndex) {
	let dot = editorTitle.querySelector('.editor-color-dot');
	if (!dot) {
		dot = document.createElement('span');
		dot.className = 'editor-color-dot';
		editorTitle.prepend(dot);
	}

	dot.style.background = getAccountColorCss(colorIndex);
}

function updateTokenLink() {
	tokenLink.href = buildTokenHref(instanceUrlInput.value);
}

async function saveCurrentInstance() {
	await requestHostPermissionIfNeeded(instanceUrlInput.value);
	const data = {
		name: instanceNameInput.value,
		rootUrl: instanceUrlInput.value,
		token: instanceTokenInput.value,
		enabled: instanceEnabledInput.checked,
		onlyParticipating: instanceParticipatingInput.checked,
		showDesktopNotif: instanceDesktopNotifInput.checked,
		playNotifSound: instanceNotifSoundInput.checked,
		filterNotifications: instanceFilterNotifInput.checked
	};

	try {
		let id = instanceIdInput.value;
		if (id) {
			await updateInstance(id, data);
		} else {
			const instance = await addInstance(data);
			id = instance.id;
			instanceIdInput.value = id;
			const instances = await getInstances();
			loadInstancesList(instances);
		}

		editorTitle.textContent = data.name || 'New Instance';

		const listItem = instancesList.querySelector(`[data-instance-id="${id}"]`);
		if (listItem) {
			listItem.querySelector('.instance-name-text').textContent = data.name || '(unnamed)';
			listItem.classList.toggle('disabled', !data.enabled);
		}

		showStatus('multi-status', 'Saved');
		browser.runtime.sendMessage({action: 'update'});
	} catch (error) {
		showStatus('multi-status', error.message, 'error');
	}
}

let undoTimeout = null;

let deleteConfirmId = null;
let deleteConfirmTimer = null;

async function confirmDeleteInstance(id) {
	const button = instancesList.querySelector(`[data-instance-id="${id}"] .delete-instance`);
	if (!button) {
		return;
	}

	if (deleteConfirmId === id) {
		clearTimeout(deleteConfirmTimer);
		deleteConfirmId = null;
		await executeDelete(id);
		return;
	}

	resetDeleteConfirm();
	deleteConfirmId = id;
	button.textContent = 'Confirm?';
	button.classList.add('confirming');
	deleteConfirmTimer = setTimeout(() => resetDeleteConfirm(), 3000);
}

function resetDeleteConfirm() {
	clearTimeout(deleteConfirmTimer);
	if (deleteConfirmId) {
		const button = instancesList.querySelector(`[data-instance-id="${deleteConfirmId}"] .delete-instance`);
		if (button) {
			button.textContent = 'Delete';
			button.classList.remove('confirming');
		}
	}

	deleteConfirmId = null;
}

async function executeDelete(id) {
	const allInstances = await getInstances();
	const originalIndex = allInstances.findIndex(i => i.id === id);
	const instance = allInstances[originalIndex];
	if (!instance) {
		return;
	}

	if (instanceIdInput.value === id) {
		closeEditor();
	}

	await deleteInstance(id);
	browser.runtime.sendMessage({action: 'update'});

	const instances = await getInstances();
	loadInstancesList(instances);
	showUndoBanner(instance, originalIndex, instances.length <= 1 ? instances[0] : null);
}

function showUndoBanner(deletedInstance, originalIndex, singleViewInstance) {
	clearUndoBanner();

	const banner = document.createElement('div');
	banner.id = 'undo-banner';
	banner.className = 'undo-banner';

	const text = document.createElement('span');
	text.textContent = `"${deletedInstance.name || '(unnamed)'}" deleted.`;

	const undoLink = document.createElement('a');
	undoLink.href = '#';
	undoLink.textContent = 'Undo';
	undoLink.addEventListener('click', async event => {
		event.preventDefault();
		clearUndoBanner();
		const instances = await getInstances();
		instances.splice(originalIndex, 0, deletedInstance);
		await saveInstances(instances);
		loadInstancesList(instances);
		browser.runtime.sendMessage({action: 'update'});
	});

	const countdown = document.createElement('span');
	countdown.className = 'undo-countdown';

	banner.append(text, ' ', undoLink, countdown);
	instancesList.parentElement.insertBefore(banner, instancesList.nextSibling);

	let remaining = 15;
	countdown.textContent = ` (${remaining}s)`;
	undoTimeout = setInterval(() => {
		remaining--;
		if (remaining <= 0) {
			clearUndoBanner();
			if (singleViewInstance !== null) {
				showSingleView(singleViewInstance);
			}
		} else {
			countdown.textContent = ` (${remaining}s)`;
		}
	}, 1000);
}

function clearUndoBanner() {
	if (undoTimeout) {
		clearInterval(undoTimeout);
		undoTimeout = null;
	}

	const existing = document.querySelector('#undo-banner');
	if (existing) {
		existing.remove();
	}
}

function showConfirmBanner(message, onConfirm, anchor) {
	clearConfirmBanner();

	const banner = document.createElement('div');
	banner.id = 'confirm-banner';
	banner.className = 'confirm-banner';

	const text = document.createElement('span');
	text.textContent = message;

	const yesLink = document.createElement('a');
	yesLink.href = '#';
	yesLink.textContent = 'Yes';
	yesLink.addEventListener('click', event => {
		event.preventDefault();
		clearConfirmBanner();
		onConfirm();
	});

	const noLink = document.createElement('a');
	noLink.href = '#';
	noLink.textContent = 'No';
	noLink.addEventListener('click', event => {
		event.preventDefault();
		clearConfirmBanner();
	});

	banner.append(text, ' ', yesLink, ' / ', noLink);

	if (anchor) {
		anchor.after(banner);
	} else {
		const activeView = singleView.classList.contains('hidden') ? multiView : singleView;
		activeView.append(banner);
	}
}

function clearConfirmBanner() {
	const existing = document.querySelector('#confirm-banner');
	if (existing) {
		existing.remove();
	}
}

// --- Shared ---

function setupEventListeners() {
	// Single view
	document.querySelector('#add-another-instance').addEventListener('click', async event => {
		event.preventDefault();
		requestSwitchToMultiView();
	});

	singleUrlInput.addEventListener('input', updateSingleTokenLink);

	for (const field of singleFields) {
		const eventType = field.type === 'checkbox' ? 'change' : 'input';
		field.addEventListener(eventType, eventType === 'change' ? saveSingleInstance : debouncedSaveSingle);
	}

	// Multi view
	addInstanceButton.addEventListener('click', addNewInstance);
	instancesList.addEventListener('click', handleInstanceListClick);
	instanceUrlInput.addEventListener('input', updateTokenLink);
	instanceEnabledInput.addEventListener('change', updateEnabledLabel);

	for (const field of multiFields) {
		const eventType = field.type === 'checkbox' ? 'change' : 'input';
		field.addEventListener(eventType, eventType === 'change' ? saveCurrentInstance : debouncedSaveMulti);
	}

	// Shared
	document.querySelector('#close-repos').addEventListener('click', hideReposModal);

	for (const element of document.querySelectorAll('[data-request-permission]')) {
		element.addEventListener('change', async event => {
			if (event.target.checked) {
				const permission = event.target.dataset.requestPermission;
				const granted = await requestPermission(permission);
				if (!granted) {
					event.target.checked = false;
				}
			}
		});
	}
}

async function showReposFilter(filterInstanceId) {
	const instance = await getInstance(filterInstanceId);
	if (!instance || !reposModal.classList.contains('hidden')) {
		return;
	}

	const reposList = document.querySelector('#repos-list');
	const loading = document.querySelector('#repos-loading');
	const error = document.querySelector('#repos-error');

	reposModal.classList.remove('hidden');
	loading.classList.remove('hidden');
	error.classList.add('hidden');
	reposList.innerHTML = '';

	try {
		const notifications = await getNotifications(instance, {});
		const repos = new Map();

		for (const notification of notifications) {
			const {owner, repository} = parseFullName(notification.repository.full_name);
			if (!repos.has(owner)) {
				repos.set(owner, new Set());
			}

			repos.get(owner).add(repository);
		}

		const filters = await repositoriesStorage.getAll();
		loading.classList.add('hidden');

		for (const [owner, repoSet] of repos) {
			const group = document.createElement('div');
			group.className = 'repo-group';

			const header = document.createElement('h4');
			header.textContent = owner;
			group.append(header);

			for (const repo of repoSet) {
				const item = document.createElement('label');
				item.className = 'repo-item';

				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';
				checkbox.dataset.owner = owner;
				checkbox.dataset.repo = repo;
				checkbox.checked = Boolean(filters[owner] && filters[owner][repo]);

				const span = document.createElement('span');
				span.textContent = repo;

				item.append(checkbox, span);
				group.append(item);
			}

			reposList.append(group);
		}

		for (const checkbox of reposList.querySelectorAll('input[type="checkbox"]')) {
			checkbox.addEventListener('change', async event => {
				const {owner, repo} = event.target.dataset;

				await (event.target.checked ? repositoriesStorage.add(owner, repo) : repositoriesStorage.remove(owner, repo));
			});
		}
	} catch (error_) {
		loading.classList.add('hidden');
		error.classList.remove('hidden');
		error.textContent = `Failed to load repositories: ${error_.message}`;
	}
}

function hideReposModal() {
	reposModal.classList.add('hidden');
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
