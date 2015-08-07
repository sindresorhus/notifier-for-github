(function () {
	'use strict';

	var xhr = (function () {
		var xhr = new XMLHttpRequest();

		return function (method, url, headers, cb) {
			if (!cb && typeof headers === 'function') {
				cb = headers;
				headers = null;
			}

			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					cb(xhr.responseText, xhr.status, xhr);
					return;
				}
			};

			xhr.open(method, url);

			if (headers) {
				Object.keys(headers).forEach(function (k) {
					xhr.setRequestHeader(k, headers[k]);
				});
			}

			xhr.setRequestHeader('If-Modified-Since', '');
			xhr.send();
		};
	})();

	window.GitHubNotify = (function () {
		var defaults = {
			rootUrl: 'https://api.github.com/',
			oauthToken: '',
			useParticipatingCount: false,
			interval: 60
		};

		var api = {
			settings: {
				get: function (name) {
					var item = localStorage.getItem(name);
					if (item === null) {
						return {}.hasOwnProperty.call(defaults, name) ? defaults[name] : undefined;
					} else if (item === 'true' || item === 'false') {
						return item === 'true';
					}
					return item;
				},
				set: localStorage.setItem.bind(localStorage),
				reset: localStorage.clear.bind(localStorage)
			}
		};

		return api;
	})();

	window.gitHubNotifCount = function (cb) {
		var token = window.GitHubNotify.settings.get('oauthToken');
		var opts = {
			Authorization: 'token ' + token
		};
		var participating = window.GitHubNotify.settings.get('useParticipatingCount')
			? '?participating=true'
			: '';
		var url = window.GitHubNotify.settings.get('rootUrl');

		if (!token) {
			cb(new Error('missing token'));
			return;
		}

		if (/(^(https:\/\/)?(api\.)?github\.com)/.test(url)) {
			url = 'https://api.github.com/notifications';
		} else {
			url += 'api/v3/notifications';
		}

		url += participating;

		xhr('GET', url, opts, function (data, status, response) {
			var interval = Number(response.getResponseHeader('X-Poll-Interval'));

			if (status >= 500) {
				cb(new Error('server error'), null, interval);
				return;
			}

			if (status >= 400) {
				cb(new Error('client error: ' + data), null, interval);
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
