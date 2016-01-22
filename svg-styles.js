'use strict';

const greyOpacity = 0.6;
const noteOpacity = 0.4;
const fonts = 'MetricWeb,sans-serif';
const headlineGrey = '#43423e';
const baseLineGrey = '#74736c';

module.exports = {

	seriesLine: {
		'stroke-width': 2,
		'fill': 'none',
		'stroke': '#000'
	},

	seriesColumn: {
	},

	seriesLineColours: [
		'#af516c',
		'#76acb8',
		'#ecafaf',
		'#81d0e6',
		'#d7706c',
		'#4e86b6'
	],

	tick: {
		'style': ''
	},

	tickLine: {
		'fill': 'none',
		'stroke': '#000',
		'stroke-opacity': 0.2
		//,'shape-rendering':'crispEdges'
	},

	valueHighlight: {
		'fill': 'none',
		'stroke': baseLineGrey
		//,'shape-rendering':'crispEdges'
	},

	yAxisTickLine: {
		'stroke-opacity': 0.2
	},

	xDomain: {
		'fill': 'none',
		'stroke': baseLineGrey
		//,'shape-rendering':'crispEdges'
	},

	yDomain: {
		'fill': 'none',
		'stroke': '#000',
		'stroke-opacity': 0
	},

	tickText: {
		'font-family': fonts,
		'fill-opacity': greyOpacity,
		'font-size': 12,
		'dy': 0
	},

	xTickText: {
		'text-anchor': 'start',
		'style': '',
		'y': 20
	},

	yTickText: {},

	titleText: {
		'font-family': fonts,
		'fill': headlineGrey,
		'font-size': 20,
		'y': 22
	},

	subtitleText: {
		'font-family': fonts,
		'fill': headlineGrey,
		'font-size': 15,
		'y': 42
	},

	sourceText: {
		'font-family': fonts,
		'font-size': 10,
		'fill-opacity': noteOpacity
	},

	keyContainer: {
		'transform': 'translate(0,-35)'
	},

	keyText: {
		'font-family': fonts,
		'font-size': 12,
		'fill': headlineGrey
	}

};
