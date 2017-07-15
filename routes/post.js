const express = require('express');
const app = express();
const router = express.Router();

const _ = require('lodash');

const mem_data = require("../data.js"); 

var postRoute = "/:id/";
router.get(postRoute, showPost);

function showPost(request, response, next)
{
  var itemStorage = mem_data.items;
  var id = request.params.id;
  var item = itemStorage[id];
  
  var html = "<html><head><title>"+item.title+"</title></head>";
  html += "<body>";
  html += item.description;
  html += "</body>";
  html += "</html>";
  response.send(html);
}

module.exports = router;