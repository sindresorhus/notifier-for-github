// This script tries to simulate a browser environment required by the extension
// Instead of polluting node global scope with all possible properties from JSDOM, only required properties are added

import { URLSearchParams } from 'url';
import chromeStub from 'chrome-stub';
import fetch from 'node-fetch';

global.fetch = fetch;
global.URLSearchParams = URLSearchParams;

global.browser = Object.assign({}, {
	runtime: {},
	notifications: {}
}, chromeStub);

// Required for `webext-options-sync`
global.chrome = global.browser;
global.HTMLElement = class HTMLElement {};
