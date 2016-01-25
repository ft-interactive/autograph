# Autograph

> automate the retrieval of data and creation of charts

[![Build Status][travis-image]][travis-url] [![Dependency Status][deps-image]][deps-url] [![Dev dependency Status][devdeps-image]][devdeps-url]

## Run locally

You'll need a `.env` file that defines the required [environment variables](env.md).

To start:

```shell
$ env $(.env) npm start
```

If you have the `dotenv` program install (eg `gem install dotenv`) you do do this instead

```shell
$ dotenv npm start
```

## Prod

crontab runs a couple of times an hour

In production, the command in your crontab should send stdout to a log file (eg autograph.log) and sterr to a separate file (eg error.log)

```shell
$ env $(cat .env) npm start 1> >(ts '%a %F %R:%.S' >> autograph.log) 2> >(ts '%a %F %T' >> error.log)

```

## what does each script do...

### gather.js 
requests a list of API endpoints from a Bertha spreadsheet, retrieves these URLs and saves the contents as CSV files named based on an FT name specified in said Bertha sheet

### create-configs.js
requests a list of charts from a Bertha spreadsheet. And loads CSVs created by gather.js to produce a JSON file which contains an array of chart configuration objects of the format used (at time of writing) by o-charts

### chart-render.js
produces a series of SVGs based on the JSON file produced by create-configs.js

### dir-table.js
produces a web page with a list of CSV files created and SVG rendered byt the afforementioned scripts

## Licence
This software is published by the Financial Times under the [MIT licence](http://opensource.org/licenses/MIT).

<!-- badge URLs -->
[travis-url]: http://travis-ci.org/ft-interactive/autograph
[travis-image]: https://img.shields.io/travis/ft-interactive/autograph.svg?style=flat-square

[deps-url]: https://david-dm.org/ft-interactive/autograph#info=dependencies
[deps-image]: https://img.shields.io/david/ft-interactive/autograph.svg?style=flat-square

[devdeps-url]: https://david-dm.org/ft-interactive/autograph#info=devDependencies
[devdeps-image]: https://img.shields.io/david/dev/ft-interactive/autograph.svg?style=flat-square
