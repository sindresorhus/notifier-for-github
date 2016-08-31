import PersistenceService from './persistence-service';

const NetworkService = {
	getHeaders(token) {
		/* eslint-disable quote-props */
		return {
			'Authorization': `token ${token}`,
			'If-Modified-Since': ''
		};
		/* eslint-enable quote-props */
	},

	request(url) {
		const token = PersistenceService.get('oauthToken');
		if (!token) {
			return Promise.reject(new Error('missing token'));
		}

		const headers = this.getHeaders(token);

		return fetch(url, {headers});
	}
};

export default NetworkService;
