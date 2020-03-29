// This script tries to simulate a browser environment required by the extension
// Instead of polluting node global scope with all possible properties from JSDOM, only required properties are added

import {URLSearchParams} from 'url';
import sinonChrome from 'sinon-chrome';

global.URLSearchParams = URLSearchParams;

global.browser = sinonChrome;
global.window = {
	console: {}
};

// Required for `webext-options-sync`
global.chrome = global.browser;
global.location = new URL('https://github.com');

global.navigator = {
	userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.80 Safari/537.36'
};
