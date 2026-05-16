import test from 'ava';
import {isNetworkError} from '../source/lib/network-error.js';

test('#isNetworkError returns true for matching Error object', t => {
	t.true(isNetworkError(new Error('network error')));
});

test('#isNetworkError is case insensitive', t => {
	t.true(isNetworkError(new Error('Network Error')));
});

test('#isNetworkError returns false for other errors', t => {
	t.false(isNetworkError(new Error('timeout')));
	t.false(isNetworkError(undefined));
});
