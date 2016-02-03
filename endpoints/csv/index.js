'use strict';

const fetch = require('../../util/fetch');
const fs = require('fs');

function pluck_data(data) {

	if (!this.params.fields) {
		this.data = data;
		return this;
	}


	this.data = data.map(d => {
		const result = {};
		for (let field of this.params.fields) {
			result[field[0]] = d[field[1]];
		}
		return result;
	});

	return this;
}

module.exports = function (job, options) {

	job.params.url = job.params.series_id;

	if (options.fields) {
		const fields = options.fields.split(/\,/g);
		job.params.fields = [];
		for (let field of fields) {
			let raw = field.split('=');
			if (raw.length === 2) {
				job.params.fields.push([raw[0].trim(), (raw[1] || '').trim()]);
			}
		}
	}

	return fetch({
		uri: job.params.url,
		type: 'csv'
	}).then(pluck_data.bind(job));
};
