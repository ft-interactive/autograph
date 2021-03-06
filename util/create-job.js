'use strict';

const d3 = require('d3');
const get_slug = require('speakingurl');

// What is an invalid date?
// - Anything falsey
// - InvalidDate, a weird special type of javascript thing.
// - if getTime isNaN
function is_valid_date(date) {
	if (!date || !(date instanceof Date)) return false;
	const time = date.getTime();
	return time && !Number.isNaN(time);
}

// Sanitise the date coming from a spreadsheet
// Return a correctly formated date string.
// If it's an invalid date then return null
function create_date(input_string, format) {
	const d = input_string ? new Date(input_string) : null;
	return is_valid_date(d) ? format(d) : null;
}

module.exports = function (data, options) {

	// These values are coming from a spreadsheet so dont trust
	// them, they may have formatting issues.
	const date_format = d3.time.format('%Y-%m-%d');

	return {

		id: data.id,
		slug: get_slug(data.id),
		units: data.units,

		transform: {
			fn: data.transform['function'] || null,
			arguments: data.transform.arguments
		},

		date_format: {
			request: date_format,
			response: date_format.parse
		},

		params: {
			series_id: decodeURI(data.seriesid),
			start_date: create_date(data.start, date_format),
			end_date: create_date(data.end, date_format),
		}
	};
}
