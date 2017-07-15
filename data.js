//category map
var catMap = {
  "all":"All",
  "bio":"Biotech and Healthcare",
  "money":"Business and Finance",
  "edu":"Education",
  "fun":"Entertainment and Media",
  "general":"General",
  "tech":"High Tech",
  "gym":"Lifestyle and Fitness",
  "travel":"Travel"
}

//store data in memory
var obj = {}

obj.catMap = catMap;
obj.rss = {};
obj.items = {};
obj.last_imap_date = null;
obj.feeds = {};

obj.checkSkip = function checkNewEmails(request, response, next)
{
  console.log("response.locals.skipToOutput = "+response.locals.skipToOutput);
  if(response.locals.skipToOutput)
  {
    //console.log("skipping route");
    next("route");
  }
  else
    next();
}



module.exports = obj;