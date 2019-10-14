import repositoriesStorage from './repositories-storage';
import optionsStorage from './options-storage';
import {listRepositories} from './lib/repositories-service';
import {getUser} from './lib/user-service';

const form = document.querySelector('#repositories-form');
const button = document.querySelector('#reload-repositories');
const filterCheckbox = document.querySelector('[name="filterNotifications"]');

button.addEventListener('click', () => !button.classList.contains('loading') && init(true));

filterCheckbox.addEventListener('change', async () => {
	await optionsStorage.set({filterNotifications: filterCheckbox.checked});
	init();
});

export default async function init(update) {
	button.classList.add('loading');
	const {filterNotifications} = await optionsStorage.getAll();
	if (!filterNotifications) {
		button.classList.remove('loading');
		form.classList.add('hidden');
		return;
	}

	form.classList.remove('hidden');

	await renderCheckboxes(update);
	await setupListeners();
	button.classList.remove('loading');
}

async function renderCheckboxes(update) {
	const tree = await listRepositories(update);
	const {login: user} = await getUser(update);

	const html = Object.keys(tree)
		.sort((a, b) => (a === user ? -1 : a.localeCompare(b)))
		.map(org => getListMarkup(org, tree[org]))
		.join('\n');

	document.querySelector('.repo-wrapper').innerHTML = html;
}

function getListMarkup(owner, repositories) {
	const repos = Object.keys(repositories);

	const list = repos
		.map(repository => {
			return `
					<li>
						<label>
							<input
								type="checkbox"
								data-owner="${owner}"
								name="${repository}"
								${repositories[repository] ? 'checked' : ''}
							/>
							${repository}
						</label>
					</li>`;
		})
		.join('\n');

	return `
		<div class="row">
			<input id="toggle-list-${owner}" type="checkbox" />
			<label for="toggle-list-${owner}">
				<span>&#9657; </span>
				<span>&#9663; </span>
				<label class="${owner}">
					<input type="checkbox" name="${owner}" />
					${owner} <span class="count small">(${repos.length})</span>
				</label>
			</label>
			<div class="list">
				<ul>${list}</ul>
			</div>
		</div>
	`;
}

function dispatchEvent() {
	// Needs to be called manually - due to the incompatible data structure
	form.dispatchEvent(
		new CustomEvent('options-sync:form-synced', {
			bubbles: true
		})
	);
}

async function setupListeners() {
	const wrapper = document.querySelector('.repo-wrapper');

	for (const ownerCheckbox of wrapper.querySelectorAll('[name]:not([data-owner])')) {
		checkState(ownerCheckbox);
		ownerCheckbox.addEventListener('click', async evt => {
			const {name: owner, checked} = evt.target;
			let options = {};
			for (const childInput of wrapper.querySelectorAll(`[data-owner="${owner}"]`)) {
				childInput.checked = checked;
				options = Object.assign({}, options, {[childInput.name]: checked});
			}

			checkState(ownerCheckbox);
			repositoriesStorage.set({[owner]: options});
			dispatchEvent();
		});
	}

	for (const repositoryCheckbox of wrapper.querySelectorAll('[data-owner]')) {
		repositoryCheckbox.addEventListener('click', async evt => {
			const {
				name: repository,
				checked,
				dataset: {owner}
			} = evt.target;
			const stored = await repositoriesStorage.getAll();
			checkState(wrapper.querySelector(`[name="${owner}"]`));
			repositoriesStorage.set({
				[owner]: Object.assign(stored[owner], {
					[repository]: checked
				})
			});
			dispatchEvent();
		});
	}
}

function checkState(element) {
	const qs = `[data-owner="${element.name}"]`;
	const allCheckboxesCount = document.querySelectorAll(qs).length;
	const checkedCount = document.querySelectorAll(`${qs}:checked`).length;
	element.checked = checkedCount === allCheckboxesCount;
	element.indeterminate = checkedCount > 0 && !element.checked;
	element.parentElement.querySelector('.count').innerHTML = `(${checkedCount}/${allCheckboxesCount})`;
	return element;
}
