'use strict';

const fetch = require('../../util/fetch');
const auth = require('./auth');

module.exports = function (job, options) {

	job.params.fields = decodeURI(options.fields);

	return fetch({
		uri: 'https://syndication.bloomberg.com/finance/v2/history',
		qs: {
			securities: job.params.series_id,
			fields: job.params.fields,
			startDate: job.params.start_date || '1900-01-01',
			endDate: job.params.end_date
		},
		json: true,
		auth: auth.credentials
	}).then(data => {

		if (!data.data) {
			throw new Error('No data attribute on response');
		} else if (data.data.null) {
			throw new Error('Undefined data series');
		} else if (!data.data[job.params.series_id]) {
			throw new Error(`Security symbol ${job.params.series_id} not found`);
		} else if (!data.data[job.params.series_id][job.params.fields]) {
			throw new Error(`Field ${job.params.fields} not found on symbol ${job.params.series_id}`);
		}

		job.data = data.data[job.params.series_id][job.params.fields];
		return job;

	});
}
