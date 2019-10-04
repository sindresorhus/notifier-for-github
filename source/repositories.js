import repositoriesStorage from './repositories-storage';
import {listRepositories} from './lib/repositories-service';
import {getUser} from './lib/user-service';
import {getRepoName} from './util';

const form = document.querySelector('#repositories-form');
const wrapper = document.querySelector('.repo-wrapper');
const loader = document.querySelector('.loader');
const filterRepositoriesCheckbox = form.querySelector('[name="filterRepositories"]');
const filterRepositoriesWrapper = form.querySelector('.filter-repositories');

loader.addEventListener('click', () => !loader.classList.contains('loading') && init(true));
filterRepositoriesCheckbox.addEventListener('click', async () => {
	await repositoriesStorage.set({filterRepositories: filterRepositoriesCheckbox.checked});
	init();
});

export default async function init(update) {
	await repositoriesStorage.stopSyncForm();
	const {filterRepositories} = await repositoriesStorage.getAll();
	if (!filterRepositories) {
		loader.classList.remove('loading');
		filterRepositoriesWrapper.classList.add('hidden');
		return;
	}

	filterRepositoriesWrapper.classList.remove('hidden');
	loader.classList.add('loading');
	await renderCheckboxes(update);
	await repositoriesStorage.syncForm(form);

	await setupListeners();
	loader.classList.remove('loading');
}

async function renderCheckboxes(update) {
	const organizations = await listRepositories(update);
	const {login: user} = await getUser(update);

	const html = Object.keys(organizations)
		.sort((a, b) => (a === user ? -1 : a.localeCompare(b)))
		.map(org => getListMarkup(org, organizations[org]))
		.join('\n');

	wrapper.innerHTML = html;
}

function getListMarkup(org, repos) {
	const list = repos
		// eslint-disable-next-line camelcase
		.map(({full_name}) => {
			const repo = getRepoName(full_name);
			return `
					<li>
						<label>
							<input type="checkbox" name="${repo}" data-organization="${org}"/>
							${repo}
						</label>
					</li>`;
		})
		.join('\n');

	return `
		<div class="row">
			<input id="toggleList_${org}" type="checkbox" />
			<label for="toggleList_${org}">
				<span>&#9657; </span>
				<span>&#9663; </span>
				<label>
					<input type="checkbox" name="${org}"/>
					${org} <span class="small">(${repos.length})</span>
				</label>
			</label>
			<div class="list">
				<ul>
					${list}
				</ul>
			</div>
		</div>
	`;
}

async function setupListeners() {
	for (const organizationCheckbox of wrapper.querySelectorAll('[name]:not([data-organization])')) {
		const {name: organization} = organizationCheckbox;

		const qs = `[data-organization="${organization}"]`;
		checkState(qs, organizationCheckbox);

		organizationCheckbox.addEventListener('click', async evt => {
			const {name, checked} = evt.target;
			let options = {[name]: checked};
			for (const childInput of wrapper.querySelectorAll(qs)) {
				childInput.checked = checked;
				options = Object.assign({}, options, {[childInput.name]: checked});
			}

			repositoriesStorage.set(options);
		});
	}

	for (const repositoryCheckbox of wrapper.querySelectorAll('[data-organization]')) {
		const {
			dataset: {organization}
		} = repositoryCheckbox;

		repositoryCheckbox.addEventListener('click', async evt => {
			const {name, checked} = evt.target;
			const organizationCheckbox = wrapper.querySelector(`[name="${organization}"]`);
			checkState(`[data-organization="${organization}"]`, organizationCheckbox);
			repositoriesStorage.set({[name]: checked, [organizationCheckbox.name]: organizationCheckbox.checked});
		});
	}
}

function checkState(qs, element) {
	const allCheckboxesCount = document.querySelectorAll(qs).length;
	const checkedCount = document.querySelectorAll(`${qs}:checked`).length;
	element.checked = checkedCount === allCheckboxesCount;
	element.indeterminate = checkedCount > 0 && !element.checked;
	return element;
}
