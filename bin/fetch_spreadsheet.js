#!/usr/bin/env node

/* jshint camelcase:false */
'use strict';

var chalk = require('chalk');
var fs = require('fs');
var google = require('googleapis');
var marked = require('marked');
var nconf = require('nconf');
var request = require('request');
var untildify = require('untildify');
var XLSX = require('xlsx');

var OAuth2Client = google.auth.OAuth2;
var drive = google.drive('v2');

marked.setOptions({
  smartypants: true
});

// Collect the environmental/config variables
nconf.env().file('./config.json');

// If expected variables are not set, set them to the default locations
nconf.defaults({
  'TT_KIT_GOOGLE_CLIENT_SECRETS': '~/.tt_kit_google_client_secrets.json',
  'TT_KIT_TOKEN': '~/.tt_kit_token.json'
});

var secretFile = untildify(nconf.get('TT_KIT_GOOGLE_CLIENT_SECRETS'));

try {
  var secrets = JSON.parse(fs.readFileSync(secretFile, 'utf8')).installed;
} catch (e) {
  if (e.code === 'ENOENT') {
    console.log(chalk.red('Could not find the client secrets file at %s. Are you sure it\'s there?'), secretFile);
  } else {
    throw e;
  }
}

var oauth2Client = new OAuth2Client(
  secrets.client_id,
  secrets.client_secret,
  secrets.redirect_uris[0]
);

function primeToken(client, cb) {
  fs.readFile(untildify(nconf.get('TT_KIT_TOKEN')), 'utf8', function(err, data) {
    if (err) { return console.log(err); }
    client.setCredentials(JSON.parse(data));
    cb();
  });
}

function keyValueProcessor(worksheet) {
  var data = {};

  for (var cell in worksheet) {
    if (cell[0] === '!') { continue; }
    if (cell[0] === 'A') {
      var aCell = worksheet[cell];
      aCell = aCell ? aCell.v : '';

      var cellNumber = cell.match(/\d+/)[0];

      var bCell = worksheet['B' + cellNumber];
      bCell = bCell ? bCell.v : '';

      var cCell = worksheet['C' + cellNumber];
      cCell = cCell ? cCell.v : '';

      if (cCell === 'markdown') {
        bCell = marked(bCell);
      }

      data[aCell] = bCell;
    }
  }

  return data;
}

function objectListProcessor(worksheet) {
  var data =  XLSX.utils.sheet_to_json(worksheet, {raw: true});

  var mdColumns = Object.keys(data[0]).filter(function(k) {
    return k.toLowerCase().slice(-3) === '_md';
  });

  if (mdColumns) {
    data.forEach(function(d) {
      mdColumns.forEach(function(c) {
        if (d.hasOwnProperty(c)) {
          d[c] = marked(d[c]);
        }
      });
    });
  }

  return data;
}

function buildDataJSON(data) {
  var workbook = XLSX.read(data, {type: 'buffer'});
  var sheets = workbook.SheetNames;
  var processor_type = nconf.get('google_spreadsheet_type');
  var overrides = nconf.get('sheet_overrides');

  var payload = {};

  sheets.forEach(function(sheet) {
    var sheet_processor;

    if (overrides.hasOwnProperty(sheet)) {
      sheet_processor = overrides[sheet];
    } else {
      sheet_processor = processor_type;
    }

    if (sheet_processor === 'keyvalue') {
      payload[sheet] = keyValueProcessor(workbook.Sheets[sheet]);
    } else if (sheet_processor === 'objectlist') {
      payload[sheet] = objectListProcessor(workbook.Sheets[sheet]);
    } else {
      throw new Error('`' + sheet_processor + '` is not a valid sheet processor.');
    }
  });

  fs.writeFileSync('data.json', JSON.stringify(payload, null, 2));
}

primeToken(oauth2Client, function() {
  drive.files.get({
    auth: oauth2Client,
    fileId: nconf.get('google_spreadsheet_key')
  }, function(err, response) {
    if (err) { return console.log(err); }
    var xlsxFileURL = response.exportLinks['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    request.get({
      uri: xlsxFileURL,
      encoding: null, // Forces the xlsx spreadsheet to be downloaded into a buffer
      headers: {
        authorization: 'Bearer ' + oauth2Client.credentials.access_token
      }
    }, function(err, response) {
      if (err) { return console.log(err); }
      buildDataJSON(response.body);
      console.log('Success!');
    });
  });
});
