'use strict';

const fetch = require('../../util/fetch');
const create_job = require('../../util/create-job');
const auth = require('./auth');

module.exports = function (options) {
	const job = create_custom_job(options);
	const req = {
		uri: 'http://markets.ft.com/research/webservices/securities/v1/time-series',
		qs: {
			source: auth.api_key,
			symbols: job.params.series_id
		},
		type: 'json',
	};
	return fetch(req).then(pluck_data.bind(job));
};

const values = ['close', 'open', 'high', 'low', 'volume'];
const default_value = values[0];

function create_custom_job(options) {
	const job = create_job(options, { date_format: '%Y-%m-%d' });
	job.params.value = options.fields ? decodeURI(options.fields) : default_value;
	if (values.indexOf(job.params.value) === -1) {
		console.error('Warning: "%s" is not a valid time series field. Valid fields are: %s', job.params.value, values.join(', '));
		job.params.value = default_value;
	}
	return job;
}

function pluck_data(data) {

	if (data.error) {
		throw new Error(data.error.errors[0].reason + ': ' + data.error.errors[0].message);
	}

	if (!data.data || !data.data.items[0] || !data.data.items[0].timeSeries || !Array.isArray(data.data.items[0].timeSeries.timeSeriesData)) {
		throw new Error('Unknown timeseries format on Markit API response');
	}

	this.data = data.data.items[0].timeSeries.timeSeriesData.map((d) => {
		return { date: d.lastClose, value: d[this.params.value] };
	});

	return this;
}