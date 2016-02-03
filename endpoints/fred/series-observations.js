'use strict';

/**
*   Docs for this API endpoint are here:
*    https://research.stlouisfed.org/docs/api/fred/series_observations.html
*
*/

const fetch = require('../../util/fetch');
const auth = require('./auth');

module.exports = function (job, options) {
	return fetch({
		uri: 'https://api.stlouisfed.org/fred/series/observations',
		qs: {
			file_type: 'json',
			api_key: auth.api_key,
			observation_start: job.params.start_date,
			observation_end: job.params.end_date,
			sort_order: 'asc',
			series_id: job.params.series_id
		},
		type: 'json',
	}).then(pluck_data.bind(job));
};

function pluck_data(data) {
	if (!data.observations) {
		throw new Error('No data observations on response');
	}
	this.data = data.observations.map((d) => {
		return { date: d.date, value: d.value };
	});
	return this;
}

/* 

Other params to this endpoint

units

A key that indicates a data value transformation.

string, optional, default: lin (No transformation)
One of the following values: 'lin', 'chg', 'ch1', 'pch', 'pc1', 'pca', 'cch', 'cca', 'log'
lin = Levels (No transformation)
chg = Change
ch1 = Change from Year Ago
pch = Percent Change
pc1 = Percent Change from Year Ago
pca = Compounded Annual Rate of Change
cch = Continuously Compounded Rate of Change
cca = Continuously Compounded Annual Rate of Change
log = Natural Log

For unit transformation formulas, see: https://alfred.stlouisfed.org/help#growth_formulas
frequency

An optional parameter that indicates a lower frequency to aggregate values to. The FRED frequency aggregation feature converts higher frequency data series into lower frequency data series (e.g. converts a monthly data series into an annual data series). In FRED, the highest frequency data is daily, and the lowest frequency data is annual. There are 3 aggregation methods available- average, sum, and end of period. See the aggregation_method parameter.

string, optional, default: no value for no frequency aggregation
One of the following values: 'd', 'w', 'bw', 'm', 'q', 'sa', 'a', 'wef', 'weth', 'wew', 'wetu', 'wem', 'wesu', 'wesa', 'bwew', 'bwem'
Frequencies without period descriptions:

d = Daily
w = Weekly
bw = Bi-Weekly
m = Monthly
q = Quarterly
sa = Semiannual
a = Annual

Frequencies with period descriptions:

wef = Weekly, Ending Friday
weth = Weekly, Ending Thursday
wew = Weekly, Ending Wednesday
wetu = Weekly, Ending Tuesday
wem = Weekly, Ending Monday
wesu = Weekly, Ending Sunday
wesa = Weekly, Ending Saturday
bwew = Bi-Weekly, Ending Wednesday
bwem = Bi-Weekly, Ending Monday

Note that an error will be returned if a frequency is specified that is higher than the native frequency of the series. For instance if a series has the native frequency 'Monthly' (as returned by the fred/series request), it is not possible to aggregate the series to the higher 'Daily' frequency using the frequency parameter value 'd'.
No frequency aggregation will occur if the frequency specified by the frequency parameter matches the native frequency of the series. For instance if the value of the frequency parameter is 'm' and the native frequency of the series is 'Monthly' (as returned by the fred/series request), observations will be returned, but they will not be aggregated to a lower frequency.
For most cases, it will be sufficient to specify a lower frequency without a period description (e.g. 'd', 'w', 'bw', 'm', 'q', 'sa', 'a') as opposed to frequencies with period descriptions (e.g. 'wef', 'weth', 'wew', 'wetu', 'wem', 'wesu', 'wesa', 'bwew', 'bwem') which only exist for the weekly and bi-weekly frequencies.
The weekly and bi-weekly frequencies with periods exist to offer more options and override the default periods implied by values 'w' and 'bw'.
The value 'w' defaults to frequency and period 'Weekly, Ending Friday' when aggregating daily series.
The value 'bw' defaults to frequency and period 'Bi-Weekly, Ending Wednesday' when aggregating daily and weekly series.
Consider the difference between values 'w' for 'Weekly' and 'wef' for 'Weekly, Ending Friday'. When aggregating observations from daily to weekly, the value 'w' defaults to frequency and period 'Weekly, Ending Friday' which is the same as 'wef'. Here, the difference is that the period 'Ending Friday' is implicit for value 'w' but explicit for value 'wef'. However, if a series has native frequency 'Weekly, Ending Monday', an error will be returned for value 'wef' but not value 'w'.
Note that frequency aggregation is currently only available for file_type equal to xml or json due to time constraints.
Read the 'Frequency Aggregation' section of the FRED FAQs for implementation details.
aggregation_method

A key that indicates the aggregation method used for frequency aggregation. This parameter has no affect if the frequency parameter is not set.

string, optional, default: avg
One of the following values: 'avg', 'sum', 'eop'
avg = Average
sum = Sum
eop = End of Period

*/
