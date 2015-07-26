//-----------------------------------------------------------------------------
// @license
// cloudant-api-mocha-tests 0.1.0 (Custom Build)
// <https://github.com/brilliantmichael/dryify/>
// Copyright 2015 Michael Isidro
// Available under ISC license <http://opensource.org/licenses/ISC>
//-----------------------------------------------------------------------------

/* jslint node: true */
/* jshint strict:false */
"use strict";

//-----------------------------------------------------------------------------
// functions
//-----------------------------------------------------------------------------

//
// http://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
//
function colorJSONStringify() {

  var colormap = {
    string_: 'blue',
    number_: 'red',
    boolean_: 'red',
    null_: 'red',
    key_: 'yellow'
  };

  _.each(arguments, function(json) {

    if (typeof json !== 'string') {
      json = JSON.stringify(json, null, 2) || "";
    }

    console.log(json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function(match) {

        var style = colormap.number_;

        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            style = colormap.key_;
          } else {
            style = colormap.string_;
          }
        } else if (/true|false/.test(match)) {
          style = colormap.boolean_;
        } else if (/null/.test(match)) {
          style = colormap.null_;
        }

        return colors[style](match);
      }
    ) + "\n");
  });
}

//-----------------------------------------------------------------------------
// native libraries
//-----------------------------------------------------------------------------
var fs = require('fs');

//-----------------------------------------------------------------------------
// npm libraries
//-----------------------------------------------------------------------------
var _ = require('lodash');
var dryify = require('dryify');
var cookie = require('cookie');
var colors = require('colors');

//-----------------------------------------------------------------------------
// Cloudant vars
//-----------------------------------------------------------------------------
//
// A global variable to store the cookies. This can be on the filesystem or
// some other cache, too.
//
var cookies;
var cloudantNeutral;
var cloudantCookie;
var CLOUDANT_ROOT_ACCOUNT;
var CLOUDANT_ROOT_PASSWORD;
var CLOUDANT_ROOT_COOKIEAUTHTOKEN;


//-----------------------------------------------------------------------------
//-----------------------------------------------------------------------------

if (
  // Load .env variables from ./.env
  require('dotenv').load()
) {

  //---------------------------------------------------------------------------
  // Credentials (keep in this module scope)
  //---------------------------------------------------------------------------
  CLOUDANT_ROOT_ACCOUNT = process.env.CLOUDANT_ROOT_ACCOUNT;
  CLOUDANT_ROOT_PASSWORD = process.env.CLOUDANT_ROOT_PASSWORD;

  // For security reasons, remove the following configuration variables from
  // @process.env
  delete process.env.CLOUDANT_ROOT_ACCOUNT;
  delete process.env.CLOUDANT_ROOT_PASSWORD;

  try {
    cookies = JSON.parse(fs.readFileSync("cookies.json"));
    CLOUDANT_ROOT_COOKIEAUTHTOKEN = cookies[CLOUDANT_ROOT_ACCOUNT];
  } catch (err) {
    colorJSONStringify(err);
  }

  if (!cookies) {
    cookies = {};
  }

  colorJSONStringify({
    CLOUDANT_ROOT_COOKIEAUTHTOKEN: CLOUDANT_ROOT_COOKIEAUTHTOKEN
  });

  //
  // If you omit the "password" field, you will get an "anonymous" connection:
  // a client that sends no authentication information (no passwords, no
  // cookies, etc.) However, for the cloudant object to be initialised, we need
  // to specify an account. In this case we use the root account name while
  // remaining "anonymous".
  //
  cloudantNeutral = require('cloudant')({
    account: CLOUDANT_ROOT_ACCOUNT,
    //
    // SECURITY CONSIDERATION:
    //
    // You MUST omit the password for it not to be insecurely re-used as the
    // URI in subsequent requests !!
    //
    // password: CLOUDANT_ROOT_PASSWORD,
    // cookie: CLOUDANT_ROOT_COOKIEAUTHTOKEN // @TODO WHY NOT WORKING
  });

  cloudantCookie = require('cloudant')({
    account: CLOUDANT_ROOT_ACCOUNT,
    cookie: CLOUDANT_ROOT_COOKIEAUTHTOKEN
  });

  //
  // https://www.npmjs.com/package/cloudant#cookie-authentication
  //
  // The below is used when authenticating with a password for the first time
  // if a valid cookie token could not be provided before.
  cloudantNeutral.auth(
    CLOUDANT_ROOT_ACCOUNT,
    CLOUDANT_ROOT_PASSWORD,
    function(err, body, headers) {


      if (err instanceof Error || err) {
        colorJSONStringify(err);
      }

      colorJSONStringify({
        headers: headers
      });

      cookies[CLOUDANT_ROOT_ACCOUNT] =
        dryify.getval(headers, 'set-cookie', function() {
          colorJSONStringify(new Error("Unable to obtain cookie token"));
          return "";
        });

      // Store the authentication cookie for later.
      fs.writeFileSync("cookies.json", JSON.stringify(cookies), "utf8");
    }
  );

  cloudantCookie.db.list(function(err, all_dbs) {
    if (err instanceof Error || err) {
      colorJSONStringify(err);
    } else if (all_dbs instanceof Array) {
      console.log("All my databases: %s", all_dbs.join(', '));
    }
  });
}