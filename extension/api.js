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
			interval: 60,
			count: 0
		};

		var api = {
			settings: {
				get: function (keys, callback) {
					// temporary: should find a way to pass default value(s) only if necessary
					keys = defaults;
					// /temporary
					chrome.storage.sync.get(keys, function (items) {
						if (chrome.runtime.error) {
							console.log(chrome.runtime.lastError);
						} else {
							console.log(items);
							callback(items);
						}
					});
				},
				set: function (items, callback) {
					chrome.storage.sync.set(items, function () {
						if (chrome.runtime.error) {
							console.log(chrome.runtime.lastError);
						} else {
							console.log(items);
							callback();
						}
					});
				},
				remove: function (keys, callback) {
					chrome.storage.sync.remove(keys, function () {
						if (chrome.runtime.error) {
							console.log(chrome.runtime.lastError);
						} else {
							console.log(keys);
							callback();
						}
					});
				},
				reset: function (callback) {
					chrome.storage.sync.clear(function () {
						if (chrome.runtime.error) {
							console.log(chrome.runtime.lastError);
						} else {
							callback();
						}
					});
				}
			}
		};

		return api;
	})();

	window.gitHubNotifCount = function (cb) {
		var token;
		var opts;
		var participating;
		var url;

		window.GitHubNotify.settings.get(['oauthToken', 'useParticipatingCount', 'rootUrl'], function (items) {
			url = items.rootUrl;
			token = items.oauthToken;
			if (!token) {
				cb(new Error('missing token'));
				return;
			}
			opts = {
				Authorization: 'token ' + token
			};
			participating = items.useParticipatingCount ? '?participating=true' : '';

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
		});
	};
})();
