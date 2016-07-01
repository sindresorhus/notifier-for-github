((root) => {
  'use strict';

  root.Constants = {
    defaults: {
      rootUrl: 'https://api.github.com/',
      oauthToken: '',
      useParticipatingCount: false,
      interval: 60
    },

    /* eslint-disable camelcase */
    notificationReasons: {
      subscribed: 'You are watching the repository',
			manual: 'You are subscribed to this thread',
			author: 'You created this thread',
			comment: 'New comment',
			mention: 'You were mentioned',
			team_mention: 'Your team was mentioned',
			state_change: 'Thread status changed',
			assign: 'You were assigned to the issue',
			default: ''
    },
    /* eslint-enable camelcase */

    colors: {
      badgeDefaultBackground: [65, 131, 196, 255],
      badgeErrorBackground: [166, 41, 41, 255]
    }

  };

})(window);
