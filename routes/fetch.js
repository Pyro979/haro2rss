const express = require('express');
const app = express();
const router = express.Router();

const he = require('he');
const imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const _ = require('lodash');

const mem_data = require("../data.js"); 

var atomRoute = "/";
router.get(atomRoute, mem_data.checkSkip, checkNewEmails);
router.get(atomRoute, mem_data.checkSkip, readEmail);

var config = {
	imap: {
		user: process.env.GMAIL,
		password: process.env.GMAIL_PASS,
		host: 'imap.gmail.com',
		port: 993,
		tls: true,
		authTimeout: 3000
	}
};

var delay = process.env.DAYS_BACK * 24 * 3600 * 1000;
var fetchOptions = {bodies: [''],markSeen: false};

function getCutOffDate(){
  var cutOff = new Date();
  cutOff.setTime(Date.now() - delay);  
  return cutOff.toISOString();
}

function getLatestCheckDate(){
  var cutOff = new Date();
  cutOff.setTime(mem_data.last_imap_date);  
  return cutOff.toISOString();
}

function checkNewEmails(request, response, next)
{
  console.log("mem_data.last_imap_date", mem_data.last_imap_date,  getLatestCheckDate());
  
  if(mem_data.rss["all"]==null){
    console.log("feed not initialized, recreate");
    response.locals.skipToOutput = false;
    next();
  } else {
    //read latest email, if no new ones skip the rest of the work
    var searchCriteria = [['SINCE', getLatestCheckDate()],['FROM','haro@helpareporter.com']];
    var goToProcessResults = function(results) { 
      console.log("number of emails since last time", results.length);
      mem_data.last_imap_date = (new Date()).getTime();
      response.locals.skipToOutput = results.length==0; next(); 
    };
  
	  imaps.connect(config).then(function(connection) {
      var fetchData = function() {return connection.search(searchCriteria, fetchOptions).then(goToProcessResults);};
		  return connection.openBox('INBOX').then(fetchData);
	  });//imap
  }//else
}

//https://github.com/chadxz/imap-simple
function readEmail(request, response, next) {
  //console.log("read email");
  var searchCriteria = [['SINCE', getCutOffDate()],['FROM','haro@helpareporter.com']];
  var goToProcessResults = function(results) { processResults(results, request, response, next); };
  
	imaps.connect(config).then(function(connection) {
    
    var fetchData = function() {return connection.search(searchCriteria, fetchOptions).then(goToProcessResults);};
  
		return connection.openBox('INBOX').then(fetchData);
    
	});
}

he.encode.options.useNamedReferences = true;
he.encode.options.allowUnsafeSymbols = true;

function processResults(results, request, response, next) {
	
  //https://stackoverflow.com/questions/21241692/read-email-body-with-node-js-imap
	var final_result = _.chain(results)
                      .reverse()
                      .map(function storeUID(e, key) {
                        var id = e.attributes.uid;
                        var all = _.find(e.parts, {"which": ""});
                        var idHeader = "Imap-Id: "+id+"\r\n";
                        
                        //encode special chars to html escape chars
                        all.body = he.encode(all.body);
                        
                        return simpleParser(idHeader+all.body);
                      }).value();
  
  Promise.all(final_result)
    .then(function(data) {
      var final_html = {};
      var html = _.each(data, function(thisData) {
        var id = thisData.headers.get("imap-id");
        final_html[id] = {"text":thisData.text, "subject":thisData.subject, "date":thisData.date};
      });

      response.locals.final_html = final_html;
      next();
	});
  
}

module.exports = router;