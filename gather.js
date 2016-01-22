'use strict';

const request = require('request-promise');
const bluebird = require('bluebird');
const save_latest = require('./util/save-latest');
const save_data_changes = require('./util/save-changes');
const endpoints = require('./endpoints');
const transform = require('./transform');

const apis = {
	bloomberg: endpoints.bloomberg.timeseries,
	bb: endpoints.bloomberg.timeseries,
	csv: endpoints.csv,
	json: endpoints.json,
	fred: endpoints.fred.series_observations,
	ceic: endpoints.ceic.series,
	markit: endpoints.markit.securities_timeseries
};

if (!process.env.QUERIES_URL) {
	throw new Error('env variable QUERIES_URL is required');
}

console.log('Checking data');

request({ url: process.env.QUERIES_URL, json: true })
	.then(data => {
		return bluebird.map(data, fetch_endpoint).catch(handle_endpoint__exception);
	}).catch(reason => {
		console.log('Hello')
	});

function fetch_endpoint(query) {

	const api_name = (query.api || '').toLowerCase();

	if (!api_name) {
		console.error('Query needs an api property');
		return;
	}

	if (!query.id) {
		console.error('Cannot process a job without an ID. Know details', query);
		return;
	}

	const factory = apis[api_name];

	if (!factory) {
		console.error('"%s" is not a known API', query.api);
		return;
	}

	const promise = factory(query);

	promise.then(transform.dataset);
	promise.then(save_latest);
	promise.then(save_data_changes);

	return promise;
}

function handle_endpoint__exception(reason) {
	if (!reason.statusCode && reason instanceof Error) {
		if (reason.url) {
			console.error('Error for %s', reason.url);
		}
		console.error(reason.stack);
	} else {
		console.error('Error:\n    url: %s\n    code: %s', reason.url, reason.statusCode);
		if (reason.error && reason.error.message) {
			console.error(reason.error.message);
		}
	}
}