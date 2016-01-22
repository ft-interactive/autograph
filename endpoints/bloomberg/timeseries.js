'use strict';

const d3 = require('d3');
const dateFormat = d3.time.format('%Y-%m-%d');
const fetch = require('../../util/fetch');
const create_job = require('../../util/create-job');
const auth = require('./auth');

module.exports = function (options) {

	const job = create_bloomberg_job(options);
	const req = {
		uri: 'https://syndication.bloomberg.com/finance/v2/history',
		qs: {
			securities: job.params.series_id,
			fields: job.params.fields,
			startDate: job.params.start_date || '1900-01-01',
			endDate: job.params.end_date
		},
		json: true,
		auth: auth.credentials
		};
		return fetch(req).then(pluck_data.bind(job));
}

function create_bloomberg_job(options) {
	const job = create_job(options, { date_format: '%Y-%m-%d' });
	job.params.fields = decodeURI(options.fields);
	return job;
}

function pluck_data(data) {
	if (!data.data) {
		throw new Error('No data attribute on response');
	} else if (data.data.null) {
		throw new Error('Undefined data series');
	} else if (!data.data[this.params.series_id]) {
		throw new Error(`Security symbol ${this.params.series_id} not found`);
	} else if (!data.data[this.params.series_id][this.params.fields]) {
		throw new Error(`Field ${this.params.fields} not found on symbol ${this.params.series_id}`);
	}

	this.data = data.data[this.params.series_id][this.params.fields];
	return this;
}
