'use strict';

const fetch = require('../../util/fetch');
const auth = require('./auth');

const values = ['close', 'open', 'high', 'low', 'volume'];
const default_value = values[0];

module.exports = function (job, options) {

	job.params.value = options.fields ? decodeURI(options.fields) : default_value;
	
	// Markit API response uses ISO 8601 timestamps
	// which we can be parsed by javascript's Date constructor
	// so we dont want/need a D3 formatter
	job.date_format.response = (s => {
		return new Date(s)
	});

	if (values.indexOf(job.params.value) === -1) {
		console.error('Warning: "%s" is not a valid time series field. Valid fields are: %s', job.params.value, values.join(', '));
		job.params.value = default_value;
	}

	return fetch({
		uri: 'http://markets.ft.com/research/webservices/securities/v1/time-series',
		qs: {
			source: auth.api_key,
			symbols: job.params.series_id
		},
		type: 'json',
	}).then(data => {

		if (data.error) {
			throw new Error(data.error.errors[0].reason + ': ' + data.error.errors[0].message);
		}

		if (!data.data || !data.data.items[0] || !data.data.items[0].timeSeries || !Array.isArray(data.data.items[0].timeSeries.timeSeriesData)) {
			throw new Error('Unknown timeseries format on Markit API response');
		}

		job.data = data.data.items[0].timeSeries.timeSeriesData.map((d) => {
			return { date: d.lastClose, value: d[job.params.value] };
		});

		return job;

	});

};
