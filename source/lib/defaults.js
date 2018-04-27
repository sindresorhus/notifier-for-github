export const defaults = new Map([
	['rootUrl', 'https://api.github.com/'],
	['oauthToken', ''],
	['useParticipatingCount', false],
	['interval', 60],
	['title', 'Notifier for GitHub']
]);

export const notificationReasons = new Map([
	['subscribed', 'You are watching the repository'],
	['manual', 'You are subscribed to this thread'],
	['author', 'You created this thread'],
	['comment', 'New comment'],
	['mention', 'You were mentioned'],
	['team_mention', 'Your team was mentioned'],
	['state_change', 'Thread status changed'],
	['assign', 'You were assigned to the issue']
]);

export const errorTitles = new Map([
	['missing token', 'Missing access token, please create one and enter it in Options'],
	['server error', 'You have to be connected to the Internet'],
	['data format error', 'Unable to find count'],
	['parse error', 'Unable to handle server response'],
	['default', 'Unknown error']
]);

export const errorSymbols = new Map([
	['missing token', 'X'],
	['default', '?']
]);

export const warningTitles = new Map([
	['default', 'Unknown warning'],
	['offline', 'No Internet connnection']
]);

export const warningSymbols = new Map([
	['default', 'warn'],
	['offline', 'off']
]);

export const colors = new Map([
	['default', [65, 131, 196, 255]],
	['error', [166, 41, 41, 255]],
	['warning', [245, 159, 0, 255]]
]);

export const getBadgeDefaultColor = () => {
	return colors.get('default');
};

export const getBadgeErrorColor = () => {
	return colors.get('error');
};

export const getBadgeWarningColor = () => {
	return colors.get('warning');
};

export const getWarningTitle = warning => {
	return warningTitles.get(warning) || warningTitles.get('default');
};

export const getWarningSymbol = warning => {
	return warningSymbols.get(warning) || warningSymbols.get('default');
};

export const getErrorTitle = error => {
	return errorTitles.get(error.message) || errorTitles.get('default');
};

export const getErrorSymbol = error => {
	return errorSymbols.get(error.message) || errorSymbols.get('default');
};

export const getNotificationReasonText = reason => {
	return notificationReasons.get(reason) || '';
};

export const defaultTitle = defaults.get('title');
