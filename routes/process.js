const express = require('express');
const router = express.Router();
const app = express();
const _ = require('lodash');
const he = require('he');

const mem_data = require("../data.js"); 

var atomRoute = "/";
router.get(atomRoute, mem_data.checkSkip,splitParts,identMeta);

function splitParts(request, response, next) {
	
  var final_html = response.locals.final_html;
  //_.each(final_html,function(html, id){ response.send("<pre>"+html+"</pre>");  }); return;
  
  var final_parts = {};
  
  _.each(final_html,function(html, id){
    //if(html.text.indexOf("OPEN Forum")>0) console.log(html.text);
    var index_parts = html.text.split("********* INDEX ***********");
    final_parts[id+"_advert"]={"raw":index_parts[0],"subject":html.subject,"date":html.date,"isAd":true, num:0};
    
    var rest = index_parts[1].split("****************************")[1];
    
    var sep = "-----------------------------------";
    var items = rest.split(sep);
    
    _.each(items, function(thisItem, num){
      
      if(thisItem.indexOf("To unsubscribe visit:")==-1)
      {
        //if(num<10)//test
          final_parts[id+"_item_"+num] = {"raw":thisItem,"subject":html.subject,"date":html.date,"isAd":false, "num":num+1};
        
      }
    });
    
  });
  
  response.locals.final_parts = final_parts;
  
  next();
}


function identMeta(request, response, next) {

   _.each(response.locals.final_parts, function(thisItem){
    
    if(thisItem.isAd)
    {
      //console.log(thisItem);
      thisItem.category = "*";
      thisItem.num=0;
      thisItem.name = "HARO";
      thisItem.email = "support@helpareporter.com";
      thisItem.query = he.decode(thisItem.raw, {'isAttributeValue': true});
      
      return; 
    }
    
    thisItem.raw = he.decode(thisItem.raw, {'isAttributeValue': true});
     
    //go through each part and identify metadata
    var compactedTxt = _.chain(thisItem.raw.split("\n"))
                  .map(String.trim)
                  .compact()
                  .value().join("\n");
    
     var txtParts = compactedTxt.split("Query:");
     var meta = txtParts[0];
     thisItem.query = txtParts[1];
     
    _.each(meta.split("\n"),function(thisMeta){ 
      //console.log(thisMeta); 
      var keyVal = thisMeta.split(": ");
      if(keyVal.length>1)
      {
        var name = keyVal[0].toLowerCase().replace(/ /g,"_");
        var value = keyVal[1].trim();
        if(name.indexOf(")_summary")>-1)
          name = "summary";    
           
        thisItem[name] = value;
      }
    });
     
  });
  
  next();
}

module.exports = router;