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
		var y_series = chart.series.map((d, i) => ({ key: d, label: chart.labels[i]|| d }));

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

			chart.updated = dataset.last_updated;

			const series_slug = slug(s);
			const start_time = chart.start ? (new Date(chart.start)).getTime() : Number.NEGATIVE_INFINITY;
			const end_time = chart.end ? (new Date(chart.end)).getTime() : Infinity;

			series[series_slug] = dataset.data.map(d => {
				const num = Number(d.value);
				return {
					date: dateFormat.parse(d.date).getTime(),
					[s]: d.value === '' ? null : (Number.isFinite(num) ? num : null)
				};
			}).filter(d => d.date >= start_time && d.date <= end_time);

		});

		//construct the o-charts line chart config
		var merged = mergeData(series, 'date').sort((a,b) => a.date - b.date);
		var columns_with_data = seriesData(merged, ['date']);
		
		const y_series_with_data = _.intersectionBy(y_series, columns_with_data, 'key');	

		if (y_series_with_data.length > 1) {
			build_artifacts.save_dataset(_.map(y_series_with_data, 'key'), merged);
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
					series: y_series_with_data
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
	return Object.keys(series).map(k => ({key: k}));
}

// Merge a set of arrays of objects, joining said objects together based on a named property
function mergeData(series, keyProperty) {
	var seriesIndices = {};
	var keys = [];
	var merged = [];

	for (var seriesName in series) {
		seriesIndices[seriesName] = _.keyBy(series[seriesName], keyProperty);
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
