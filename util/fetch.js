'use strict';

const request = require('request-promise');
const d3 = require('d3');
const Bluebird = require('bluebird');
const xml = Bluebird.promisify(require('xml2js').parseString);

const csv = d3.csv.parse;
const tsv = d3.tsv.parse;

module.exports = function fetch(o) {

	o.resolveWithFullResponse = true;

	if (o.json) {
		o.json = false;
		o.type = 'json'
	}

	if (o.csv) {
		o.type = 'csv';
	}

	if (o.xml) {
		o.type = 'xml';
	}

	if (!o.type) {
		o.type = 'text';
	}

	return request(o).then(response => {

		console.log('%s %s %s %s', response.request.method, response.statusCode,
			response.request.uri.href, o.type);

		let data;

		if (o.type === 'json') {
			try {
				data = JSON.parse(response.body);
			} catch (err) {
				if (err instanceof SyntaxError) {
					throw new Error('Response is not valid JSON. Offending URL: ' + response.request.uri.href);
				} else {
					throw err;
				}
			}
		} else if (o.type === 'csv') {
			data = csv(response.body);
		} else if (o.type === 'tsv') {
			data = tsv(response.body);
		} else if (o.type === 'xml') {
			data = xml(response.body);
		} else {
			data = response.body;
		}

		if (!data) {
			throw new Error('No data');
		}

		return data;
	}).catch(err => {
		err.url = err.response ? err.response.request.uri.href : 'Unknown URL';
		throw err;
	});
}