'use strict';

const fs = require('fs');
const writeIfNew = require('./util/write-if-new');
const build_artifacts = require('./util/build-artifacts');
const csvs = build_dataset_list();
const svgs = build_chart_list();
const styles = 'html{font-family:sans-serif}.datasets{font-family:monospace;margin:20px;border-spacing:0;}.datasets td{padding:3px 5px;}.chart{width:320px;float:left;margin:20px;border-top:1px solid black;}.today{background-color:#FF4136;color:#800600;}.today a{color:#fff;}.label{border-radius:2px;padding:3px;font-size:11px;}';
const html = '<!doctype html><html><head><title>economic data CSVs</title><style>' + styles + '</style></head><body><h1>Economic data</h1><nav>Jump to: <a href="#datasets">CSV downloads</a> | <a href="#charts">Charts</a></nav><h2 id="datasets">CSV downloads</h2>' + csvs + '<hr/><h2 id="charts">Charts</h2>' + svgs + '</body></html>';

writeIfNew(process.env.PUBLIC_DIR + '/index.html', html);

function most_recent_first(a, b) {
	return b.modified.getTime() - a.modified.getTime();
}

function build_dataset_list() {
	const today = new Date().toDateString();
	return '<table class="datasets">' + build_artifacts.list_datasets().sort(most_recent_first)
							.map(d => '<tr class="'+ (d.modified.toDateString() === today ? 'today' : '') +'"><td><a href="data/' + d.name + '">' + d.name + '</a>&nbsp;(' + d.size + ')</td><td>' + d.modified.toUTCString() + '</td></tr>').join('') + '</table>';
}

function build_chart_list() {
	const today = new Date().toDateString();
	return '<div class="charts">' + build_artifacts.list_charts().sort(most_recent_first)
		.map(d =>
			'<div class="chart"><object type="image/svg+xml" data="graphics/' +
			d.name + '" width="100%"></object> <p><small>' +
			d.modified.toUTCString() + '</small>'+ (d.modified.toDateString() === today ? ' <span class="label today">Today</span>' : '') +'</p><p><a href="graphics/' +
			d.name + '" download>svg</a>&nbsp;(' + d.size + ') | <a href="https://image.webservices.ft.com/v1/images/raw/' +
			process.env.PUBLIC_URL + '/graphics/' + d.name + '?width=400&source=ig_autograph" download>png</a></p></div>'
			).join('') + '</div>';
}
