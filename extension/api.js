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

		if (!chrome.storage) {
			console.error('Add the "storage" permission!');
			return;
		}

		var api = {
			settings: {
				get: function (data, callback, sync) {
					sync = true;
					var storage = sync ? chrome.storage.sync : chrome.storage.local;
					
					// temporary
					data = defaults;

					storage.get(data, function(items) {
						if (chrome.runtime.error) {
							console.log(chrome.runtime.lastError);
						} else {
							console.log(items);
							callback(items);
						}
					});
				},
				set: function (data, callback, sync) {
					sync = true;
					var storage = sync ? chrome.storage.sync : chrome.storage.local;
					storage.set(data, function() {
						if (chrome.runtime.error) {
							console.log(chrome.runtime.lastError);
						} else {
							console.log(data);
							callback();
						}
					});
				},
				remove: function (data, sync) {
					sync = true;
					var storage = sync ? chrome.storage.sync : chrome.storage.local;
					storage.remove(data);
				},
				reset: function (sync) {
					sync = true;
					var storage = sync ? chrome.storage.sync : chrome.storage.local;
					storage.clear();
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

		window.GitHubNotify.settings.get(['oauthToken', 'useParticipatingCount', 'rootUrl'], function(items) {
			url = items.rootUrl;
			token = items.oauthToken;
			participating = items.useParticipatingCount ? '?participating=true' : '';

			if (!token) {
				cb(new Error('missing token'));
				return;
			} else {
				opts = {
					Authorization: 'token ' + token
				};
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
		});
	};
})();
