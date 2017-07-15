const express = require('express');
const router = express.Router();
const app = express();
const _ = require('lodash');
const Feed = require('feed');

const mem_data = require("../data.js"); 

var atomRoute = "/";
var domain = "https://"+process.env.PROJECT_DOMAIN+".glitch.me";
var fullAtomRoute = domain+"/atom/";

router.get(atomRoute, mem_data.checkSkip,rss);

function getFeed(cat, catName)
{
  var feed = new Feed({
    title: 'HARO - '+catName,
    description: 'Help a Reporter Out (HARO) is the most popular sourcing service in the English-speaking world, connecting journalists and bloggers with relevant expert sources to meet journalists’ demanding deadlines and enable brands to tell their stories.',
    image: 'https://static.helpareporter.com/wp-content/themes/haro/images/logo_black.png',
    favicon: 'https://haro-wp-files.s3.amazonaws.com/wp-content/uploads/2015/10/favicon.ico',
    copyright: 'Copyright 2008-'+(new Date().getFullYear())+' Cision US, Inc. All Rights Reserved.',
    
    id: fullAtomRoute+cat+"/",
    link: fullAtomRoute+cat+"/",
    feedLinks: {atom: fullAtomRoute+cat+"/"}
  });
  
  return feed;
}

function getAllFeeds(){
  var catMap = mem_data.catMap;
  
  var feeds = {};
  _.each(catMap,function(catName, cat){ feeds[cat] = getFeed(cat, catName); });
  
  return feeds;
}

function getCatByName(catName){
  return _.findKey(mem_data.catMap,function (o){return o==catName;});
}

function getQuery(post)
{
  var q = "Category: "+post.category+"<br>"+
      "Name: <a href=\"mailto:"+post.email+"?subject="+encodeURIComponent("HARO Query: "+post.summary)+"\">"+(post.name || "unknown")+"</a> ("+post.media_outlet+")<br>"+
      "Deadline: "+post.deadline+"<br>"+
      "Query:<pre>"+urlify(post.query)+"</pre>";
  
  if(post.isAd)
    q = "Query:<pre>"+urlify(post.query)+"</pre>";
  
  return q;
}

//https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
function urlify(text) {
  
    text = text.replace(/</g,"&lt;");
  
    var urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '">' + url + '</a>';
    })
    // or alternatively
    // return text.replace(urlRegex, '<a href="$1">$1</a>')
}

function rss(request, response, next) {
  
  var feeds = getAllFeeds();
  var final_html = response.locals.final_parts;
  var itemStorage = mem_data.items;
  
  _.each(final_html,function(post, id){
     
    if(!post.query)
      return;
    
    var query = getQuery(post);
    var date = new Date(post.date);
    
    var item = {
      title: "|"+post.category+"| "+post.summary+" ("+post.media_outlet+") ",
      id: "https://substantial-vinyl.glitch.me/post/"+id,
      link: "https://substantial-vinyl.glitch.me/post/"+id,//todo show if requested
      description: query,
      content: query,
      author: [{
        name: post.name || post.email,
        email: post.email
      }],
      date: date.addMinutes(post.num)
    };
    
    if(post.isAd)
      item.title = post.subject;
    
    var thisCat = getCatByName(post.category);
    
    if(post.category=="*")
      _.each(feeds, function(thisFeed){ thisFeed.addItem(item); })
    else
    {
      feeds["all"].addItem(item);
      if(feeds[thisCat])
        feeds[thisCat].addItem(item);
    }
    
    itemStorage[id] = item;
    
  });
  
  mem_data.rss = {};
  mem_data.last_imap_date = (new Date()).getTime();
  _.each(feeds,function(thisFeed, thisCat){
    
    mem_data.rss[thisCat] = thisFeed.atom1();
    
  });
  
  next();
}

Date.prototype.addMinutes = function(minutes) {
            this.setMinutes(this.getMinutes() + minutes);
            return this;
        };

module.exports = router;