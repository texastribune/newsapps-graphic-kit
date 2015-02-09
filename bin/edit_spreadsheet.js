#!/usr/bin/env node

/* jshint camelcase:false */
'use strict';

var chalk = require('chalk');
var fs = require('fs');
var google = require('googleapis');
var nconf = require('nconf');
var _open = require('open');
var untildify = require('untildify');

var OAuth2Client = google.auth.OAuth2;
var drive = google.drive('v2');

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

primeToken(oauth2Client, function() {
  drive.files.get({
    auth: oauth2Client,
    fileId: nconf.get('google_spreadsheet_key')
  }, function(err, response) {
    if (err) { return console.log(err); }
    console.log('Opening...');
    _open(response.alternateLink);
  });
});
