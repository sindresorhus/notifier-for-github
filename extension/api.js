(function () {
	'use strict';

	var xhr = (function () {
		var xhr = new XMLHttpRequest();
		return function (method, url, callback) {
			xhr.onreadystatechange = function () {
				if (xhr.readyState === 4) {
					callback(xhr.responseText, xhr.status);
				}
			};
			xhr.open(method, url);
			xhr.send();
		};
	})();

	window.GitHubNotify = (function () {
		var defaults = {
			notificationUrl: 'https://github.com/notifications',
			counterSelector: 'a[href="/notifications"] .count'
		};

		var api = {
			settings: {
				get: function (name) {
					var item = localStorage.getItem(name);
					return item === null ? ({}.hasOwnProperty.call(defaults, name) ? defaults[name] : void 0) : item;
				},
				set: localStorage.setItem.bind(localStorage),
				reset: function () {
					Object.keys(localStorage).forEach(api.settings.revert);
				},
				revert: localStorage.removeItem.bind(localStorage)
			}
		};

		return api;
	})();

	window.gitHubNotifCount = function (callback, settings) {
		settings = settings || {};
		var NOTIFICATIONS_URL = settings.notificationUrl || GitHubNotify.settings.get('notificationUrl');
		var COUNTER_SELECTOR = settings.counterSelector || GitHubNotify.settings.get('counterSelector');
		var tmp = document.createElement('div');

		xhr('GET', NOTIFICATIONS_URL, function (data, status) {
			if (status >= 400) {
				callback(-1);
			} else {
				tmp.innerHTML = data;
				var countElem = tmp.querySelector(COUNTER_SELECTOR);
				if (countElem) {
					callback(parseInt(countElem.textContent));
				} else {
					callback(-2);
				}
			}
		});
	};
})();
