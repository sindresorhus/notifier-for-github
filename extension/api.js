(() => {
	'use strict';

	const xhr = (() => {
		const xhr = new XMLHttpRequest();

		return (method, url, headers, cb) => {
			if (!cb && typeof headers === 'function') {
				cb = headers;
				headers = null;
			}

			xhr.onreadystatechange = () => {
				if (xhr.readyState === 4) {
					cb(xhr.responseText, xhr.status, xhr);
					return;
				}
			};

			xhr.open(method, url);

			if (headers) {
				Object.keys(headers).forEach(x => {
					xhr.setRequestHeader(x, headers[x]);
				});
			}

			xhr.setRequestHeader('If-Modified-Since', '');
			xhr.send();
		};
	})();

	window.GitHubNotify = (() => {
		const defaults = {
			rootUrl: 'https://api.github.com/',
			oauthToken: '',
			useParticipatingCount: false,
			openNewtab: false,
			interval: 60
		};

		const api = {
			settings: {
				get: name => {
					const item = localStorage.getItem(name);

					if (item === null) {
						return {}.hasOwnProperty.call(defaults, name) ? defaults[name] : undefined;
					}

					if (item === 'true' || item === 'false') {
						return item === 'true';
					}

					return item;
				},
				set: localStorage.setItem.bind(localStorage),
				remove: localStorage.removeItem.bind(localStorage),
				reset: localStorage.clear.bind(localStorage)
			}
		};

		api.defaults = defaults;

		return api;
	})();

	window.gitHubNotifCount = cb => {
		const token = window.GitHubNotify.settings.get('oauthToken');
		const opts = {
			Authorization: `token ${token}`
		};
		const participating = window.GitHubNotify.settings.get('useParticipatingCount') ? '?participating=true' : '';
		let url = window.GitHubNotify.settings.get('rootUrl');

		if (!token) {
			cb(new Error('missing token'), null, window.GitHubNotify.defaults.interval);
			return;
		}

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(url)) {
			url = 'https://api.github.com/notifications';
		} else {
			url += 'api/v3/notifications';
		}

		url += participating;

		xhr('GET', url, opts, (data, status, response) => {
			const interval = Number(response.getResponseHeader('X-Poll-Interval'));

			if (status >= 500) {
				cb(new Error('server error'), null, interval);
				return;
			}

			if (status >= 400) {
				cb(new Error(`client error: ${data}`), null, interval);
				return;
			}

			try {
				data = JSON.parse(data);
			} catch (err) {
				cb(new Error('parse error'), null, interval);
				return;
			}

			if (data && data.hasOwnProperty('length')) {
				cb(null, data.length, interval);
				return;
			}

			cb(new Error('data format error'), null, interval);
			return;
		});
	};
})();
