import {makeApiRequest} from './api';
import localStore from './local-store';

function parseLinkHeader(header) {
	return header.split(',').reduce((links, part) => {
		const [sectionUrl, sectionName] = part.split(';');
		const url = sectionUrl.replace(/<(.+)>/, '$1').trim();
		const name = sectionName.replace(/rel="(.+)"/, '$1').trim();
		return Object.assign({}, links, {[name]: url});
	}, {});
}

export async function getRepositories(
	repos = [],
	params = {
		page: '1',
		per_page: '100' // eslint-disable-line camelcase
	}
) {
	const {headers, json} = await makeApiRequest('/user/repos', params);
	repos = [...repos, ...json];

	const {next} = parseLinkHeader(headers.get('Link'));
	if (!next) {
		return repos;
	}

	const {searchParams} = new URL(next);
	return getRepositories(repos, {
		page: searchParams.get('page'),
		per_page: searchParams.get('per_page') // eslint-disable-line camelcase
	});
}

export async function listRepositories(update) {
	let tree = await localStore.get('repositories');
	if (update || !tree) {
		const repos = await getRepositories();
		/* eslint-disable camelcase */
		tree = repos.reduce((tree, {id, full_name, owner: {login}}) => {
			return Object.assign({}, tree, {
				[login]: [...(tree[login] || []), {id, full_name}]
			});
		}, {});
		/* eslint-enable camelcase */
		await localStore.set('repositories', tree);
	}

	return tree;
}
