'use strict';

const fs = require('fs');
const request = require('request-promise');
const d3 = require('d3');
const slug = require('speakingurl');
const _ = require('lodash');
const build_artifacts = require('./util/build-artifacts');

const dateFormat = d3.time.format('%Y-%m-%d');
const ftDateFormat = d3.time.format('%d %b %Y');
var renderList = [];

if (!process.env.CHARTS_URL) {
	throw new Error('env variable QUERIES_URL is required');
}

//get the bertha sheet
console.log('creating nightingale config JSON');

request({ uri: process.env.CHARTS_URL, json: true }).then(data => {

	data.forEach(function (chart) {

		// load the data files for each index...

		var series = {};

		chart.series.forEach(function (s) {

			let dataset;
			
			try {
				dataset	= build_artifacts.read_dataset(s);
			} catch (e) {
				if (e.code === 'ENOENT') {
					console.error('Dataset "%s" not found', s);
					return;
				}
				
				throw e;
			}

			series[slug(s)] = dataset.data.map(function (d) {
				var o = {};
				o[s] = d.value;
				o.date = d.date;
				return o;
			});

			chart.updated = dataset.last_updated;

			series[slug(s)] = series[slug(s)].filter(function (d) {
				if (chart.start && (dateFormat.parse(d.date).getTime() < (new Date(chart.start)).getTime())) {
					return false;
				}
				if (chart.end && (dateFormat.parse(d.date).getTime() > (new Date(chart.end)).getTime())) {
					return false;
				}
				return true;
			});

		});

		//construct the o-charts line chart config
		var merged = mergeData(series, 'date');

		var seriesNames = seriesData(merged, ['date']);

		// override series labels
		let seriesNames_copy = seriesNames.slice(0);
		let o;

		for (let i = 0; i < chart.labels.length; i++) {
			if (!seriesNames_copy.length) {
				break;
			}
			if (chart.labels[i]) {
				chart.labels[i] = chart.labels[i].toString().trim();
			}
			if (seriesNames_copy[0].key === chart.series[i]) {
				o = seriesNames_copy.shift();
				if (chart.labels[i]) {
					o.label = chart.labels[i];
				}
			} 
		}

		if (seriesNames.length > 1) {
			build_artifacts.save_dataset(_.pluck(seriesNames, 'key'), merged);
		}

		var source = chart.source;

		if (chart.updated) {
			var chartData = {
				type: chart.type,
				updated: ftDateFormat(chart.updated),
				title: chart.title,
				subtitle: chart.subtitle,
				source: source,
				footnote: chart.footnote,
				highlightvalue: chart.highlightvalue ? chart.highlightvalue : 0,
				x: {
					series: 'date'
				},
				y: {
					series: seriesNames
				},
				data: merged
			};

			renderList.push(chartData);
		}

	});

	build_artifacts.save_nightingale_config(renderList);

}).catch(reason => {

	console.error('Error: %s', reason.url || 'Undefined URL');

	if (!reason.statusCode && reason instanceof Error) {
		console.error(reason.stack);
		return;
	} else {
		console.error('Error code %d', reason.statusCode);
		if (reason.error && reason.error.message) {
			console.error(reason.error.message);
		}
	}

});

function seriesData(a, exclude) {

	const series = {};
	a.forEach(function (d) {
		for (var s in d) {
			if (!series[s] && exclude.indexOf(s) < 0) {
				series[s] = true;
			}
		}
	});
	return Object.keys(series).map(function (d) {
		return {
			'key': d, 'label': d
		};
	});
}

// Merge a set of arrays of objects, joining said objects together based on a named property
function mergeData(series, keyProperty) {
	var seriesIndices = {};
	var keys = [];
	var merged = [];

	for (var seriesName in series) {
		seriesIndices[seriesName] = _.indexBy(series[seriesName], keyProperty);
		keys = keys.concat(Object.keys(seriesIndices[seriesName]));
	}

	_.uniq(keys).forEach(function (k) {
		var m = {};
		m[keyProperty] = k;
		for (var seriesName in series) {
			m = _.merge(m, seriesIndices[seriesName][k]);
		}
		merged.push(m);
	});

	return merged;
}
