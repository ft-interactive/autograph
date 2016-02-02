'use strict';

const d3 = require('d3');
const fs = require('fs');
const jsdom = require('jsdom');
const slug = require('speakingurl');
const _ = require('lodash');
const SVGStyles = require('./svg-styles.js');
const build_artifacts = require('./util/build-artifacts');
const cssLink = '<?xml-stylesheet type="text/css" href="https://ig.ft.com/graphics/bloomberg-economics/chart-style.css" ?>';

const chart_configs = build_artifacts.read_nightingale_config(); 

createLines(chart_configs);

function createLines(data) {

	console.log('Creating ' + data.length + ' line charts');

	jsdom.env({
		html: '<html><body></body></html>',
		features: { QuerySelector: true },
		done: function (errors, window) {
			window.d3 = d3.select(window.document);
			var chartWidth = 304;
			var chartHeight = 286;
			var margin = { top: 100, left: 1, bottom: 50, right: 45 };
			var plotWidth = chartWidth - (margin.left + margin.right);
			var plotHeight = chartHeight - (margin.top + margin.bottom);
			var dateFormat = d3.time.format('%Y-%m-%d');
			var keyLineLength = 25;
			var keyElementHeight = 20;

			var svg = window.d3.select('body').selectAll('svg').data(data)
				.enter()
				.append('div').attr('class', 'container')
				.append('svg').attr({
					xmlns: 'http://www.w3.org/2000/svg',
					viewBox: '0 0 ' + chartWidth + ' ' + chartHeight
				});

			svg.append('text')
				.classed('chart-title', true)
				.attr(SVGStyles.titleText)
				.text(d => d.title);

			svg.append('text')
				.classed('chart-subtitle', true)
				.attr(SVGStyles.subtitleText)
				.text(d => d.subtitle);

			svg.append('text')
				.classed('chart-source', true)
				.attr(SVGStyles.sourceText)
				.attr({ 'y': chartHeight - 5 }) //the -5 is to stop descenders dropping off the edge
				.text(d => 'Source: ' + d.source + '. ' + d.updated);

			svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
				.each(function (datum) {
					var container = d3.select(this);
					var seriesKeys = _.map(datum.y.series, 'key');

					if (!datum.xDomain) {
						datum.xDomain = d3.extent(datum.data,  d => new Date(d[datum.x.series]));
					}

					if (!datum.yDomain) {
						datum.yDomain = [];
						datum.yDomain[0] = d3.min(datum.data, function (d) {
							var values = [];
							seriesKeys.forEach(key => {
								values.push(Math.floor(Number(d[key])));
							});
							return d3.min(values);
						});

						datum.yDomain[1] = d3.max(datum.data, function (d) {
							var values = [];
							seriesKeys.forEach(key => {
								values.push(Math.ceil(Number(d[key])));
							});
							return d3.max(values);
						});
					}

					var xScale = d3.time.scale()
						.domain(datum.xDomain)
						.range([0, plotWidth])
						.nice();

					var yScale = d3.scale.linear()
						.domain(datum.yDomain)
						.range([plotHeight, 1])
						.nice();

					var dateAxis = d3.svg.axis()
						.ticks(5)
						.scale(xScale)
						.outerTickSize(0);

					var valueAxis = d3.svg.axis()
						.orient('right')
						.ticks(6)
						.tickSize(-plotWidth)
						.scale(yScale);

					container.append('g')
						.attr({
							'transform': 'translate(0,' + plotHeight + ')',
							'class': 'x axis'
						})
						.call(dateAxis);

					container.append('g')
						.attr({
							'transform': 'translate(' + plotWidth + ',0)',
							'class': 'y axis'
						})
						.call(valueAxis)
						.call(function (parent) {
							if (datum.highlightvalue <= yScale.domain()[1] && datum.highlightvalue >= yScale.domain()[0]) {
								parent.append('line')
									.attr({
										'class': 'highlight-line',
										'x1': 0,
										'x2': -plotWidth,
										'y1': yScale(datum.highlightvalue),
										'y2': yScale(datum.highlightvalue)
									});
							}
						});

					container.selectAll('.tick').attr(SVGStyles.tick);
					container.selectAll('.tick line').attr(SVGStyles.tickLine);
					container.selectAll('.y.axis .tick line').attr(SVGStyles.yAxisTickLine);
					container.selectAll('.tick text').attr(SVGStyles.tickText);
					container.selectAll('.x.axis text').attr(SVGStyles.xTickText);
					container.selectAll('.y.axis text').attr(SVGStyles.yTickText);
					container.selectAll('.x.axis .domain').attr(SVGStyles.xDomain);
					container.selectAll('.y.axis .domain').attr(SVGStyles.yDomain);
					container.selectAll('.y.axis .highlight-line').attr(SVGStyles.valueHighlight);

					if (seriesKeys.length > 1) {

						container.append('g')
							.attr('class', 'chart-key')
							.attr(SVGStyles.keyContainer);
					
						seriesKeys.forEach(function (key, i) {
							
							var keyElement = container.select('.chart-key')
										.append('g')
										.attr({
											'class': 'key-element',
											'transform': 'translate(0,' + (i * keyElementHeight) + ')'
										});

							keyElement.append('text')
								.attr('x', keyLineLength + 3)
								.attr(SVGStyles.keyText)
								.text(datum.y.series[i].label || key);

							keyElement.append('line')
								.attr({
									x1: 0,
									x2: keyLineLength,
									y1: -keyElementHeight / (SVGStyles.keyText['font-size'] / 3),
									y2: -keyElementHeight / (SVGStyles.keyText['font-size'] / 3)
								})
								.attr(SVGStyles.seriesLine)
								.attr('stroke', SVGStyles.seriesLineColours[i]);
						});
					}

					var linesContainer = container.append('g');
					var line_colors = SVGStyles.seriesLineColours.slice(0, seriesKeys.length);

					// take a shallow copy of the array and reverse the order
					// so that most important line is drawn on top, least important at the bottom
					seriesKeys.slice(0).reverse().forEach(function (key, i) {

						const line = d3.svg.line()
							.defined(d => d[key] != null && !isNaN(d[key]))
							.x(d => round_3dp(xScale(new Date(d.date))))
							.y(d => round_3dp(yScale(d[key])));

						linesContainer.append('path')
							.attr('d', line(datum.data))
							.attr(SVGStyles.seriesLine)
							.attr('stroke', line_colors.pop());

					});

			});

			window.d3.selectAll('.container').each(function (datum) {
				const output = String(d3.select(this).html());
				build_artifacts.save_svg_chart(datum.title, cssLink + output);
			});

		}

	});

}

function round_3dp(x) {
	return Math.round(x * 1000) / 1000;
}
