const refreshRoute = "/refresh/";
const glitchup = require('./glitchup');
glitchup("/refresh");

const express = require('express');
const app = express();
const imaps = require('imap-simple');
const Feed = require('feed');
const simpleParser = require('mailparser').simpleParser;
const _ = require('lodash');

const mem_data = require("./data.js"); 

const post = require("./routes/post"); 
const fetch = require("./routes/fetch"); 
const read = require("./routes/process"); 
const rss = require("./routes/rss"); 

app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  console.log("root");
  response.sendFile(__dirname + '/views/index.html');
});

var postRoute = "/post";
app.use(postRoute, post);

var atomRoute = "/atom/:category/";

var combinedAtomRefresh = [atomRoute, refreshRoute];

app.get(atomRoute, function(request, response, next){
  response.locals.skipToOutput = (mem_data.rss[request.params.category] != null);
  next();
});

app.use(combinedAtomRefresh, fetch);
app.use(combinedAtomRefresh, read); 
app.use(combinedAtomRefresh, rss);

app.get(atomRoute, output);
app.get(atomRoute, errorHandler);

app.use(refreshRoute, function(request, response, next){ 
  console.log("/refresh/");
  response.send("done"); });


//https://github.com/jpmonette/feed

function output(request, response, next) {
	
  var feed = mem_data.rss[request.params.category];
  //console.log(_.keys(mem_data.rss));
  //console.log(request.params.category)
  response.write(feed);
  response.end();
  
}

function errorHandler(request, response, next, err) {
	response.send(err);
}

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
	console.log('Your app is listening on port ' + listener.address().port);
}); 