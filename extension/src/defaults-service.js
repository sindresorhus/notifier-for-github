const defaults = new Map([
	['rootUrl', 'https://api.github.com/'],
	['oauthToken', ''],
	['useParticipatingCount', false],
	['interval', 60],
	['title', 'Notifier for GitHub']
]);

const notificationReasons = new Map([
	['subscribed', 'You are watching the repository'],
	['manual', 'You are subscribed to this thread'],
	['author', 'You created this thread'],
	['comment', 'New comment'],
	['mention', 'You were mentioned'],
	['team_mention', 'Your team was mentioned'],
	['state_change', 'Thread status changed'],
	['assign', 'You were assigned to the issue']
]);

const errorTitles = new Map([
	['missing token', 'Missing access token, please create one and enter it in Options'],
	['server error', 'You have to be connected to the Internet'],
	['data format error', 'Unable to find countt'],
	['parse error', 'Unable to handle server response'],
	['default', 'Unknown error']
]);

const errorSymbols = new Map([
	['missing token', 'X'],
	['default', '?']
]);

const colors = new Map([
	['default', [65, 131, 196, 255]],
	['error', [166, 41, 41, 255]]
]);

const DefaultsService = {
	getDefaults() {
		const obj = {};
		defaults.forEach((value, key) => {
			obj[key] = value;
		});
		return obj;
	},

	getBadgeDefaultColor() {
		return colors.get('default');
	},

	getBadgeErrorColor() {
		return colors.get('error');
	},

	getNotificationReasonText(reason) {
		return notificationReasons.get(reason) || '';
	},

	getDefaultTitle() {
		return defaults.get('title');
	},

	getErrorTitle(error) {
		return errorTitles.get(error.message) || errorTitles.get('default');
	},

	getErrorSymbol(error) {
		return errorSymbols.get(error.message) || errorSymbols.get('default');
	}
};

export default DefaultsService;
