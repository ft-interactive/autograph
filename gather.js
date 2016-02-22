'use strict';

const request = require('request-promise');
const bluebird = require('bluebird');
const save_latest = require('./util/save-latest');
const save_data_changes = require('./util/save-changes');
const endpoints = require('./endpoints');
const transform = require('./transform');
const create_job = require('./util/create-job');

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

let ignored_apis = [];

if (process.env.IGNORE_APIS) {
	ignored_apis = process.env.IGNORE_APIS.split(/,\s*/g).map(s => s.toLowerCase());
	if (ignored_apis.length) {
		console.log('%d ignored APIs: "%s"', ignored_apis.length, ignored_apis.join('", "'));
	}
}

console.log('Checking data');

request({ url: process.env.QUERIES_URL, json: true })
	.then(data => {
		return bluebird.map(data, fetch_endpoint).catch(handle_endpoint__exception);
	}).catch(reason => {
		console.dir(reason);
	});

function fetch_endpoint(query) {

	const api_name = (query.api || '').toLowerCase();

	if (!api_name) {
		console.error('API not defined. id="%s"', query.id);
		return;
	}

	if (!query.id) {
		console.error('Job ID missing. api=%s series_id=%s', query.id, query.seriesid);
		return;
	}

	if (!query.seriesid) {
		console.error('Series ID missing. id="%s"', query.id);
		return;
	}


	const factory = apis[api_name];

	if (!factory) {
		console.error('Unknown API. api=%s id="%s"', query.api, query.id);
		return;
	}
	
	if (ignored_apis.indexOf(api_name) !== -1) {
		console.warn('API currently being ignored. api=%s id="%s" series_id=%s', api_name, query.id, query.seriesid);
		return;
	}

	const promise = factory(create_job(query), query);

	promise.then(strings_to_dates);
	promise.then(transform.dataset);
	promise.then(save_latest);
	promise.then(save_data_changes);

	return promise;
}

function strings_to_dates(job) {
	var date_factory = job.date_format.response || (s => new Date(s));
	job.data = job.data
								// remove null rows
								.filter(Boolean)
								// convert date strings to date objects
								.map(d => {
										d.date = d.date && date_factory(d.date);
										return d;
								})
								// remove rows where date is null or invalid date
								.filter(d => d.date != null && !Number.isNaN(+d.date));
	return job;
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
