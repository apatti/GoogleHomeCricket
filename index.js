var express = require('express');
var app = express();
var feed = require('rss-to-json');
var cricketURI = "http://static.cricinfo.com/rss/livescores.xml";
app.set('port', (process.env.PORT || 8054));

app.get('/',function(req,res){
  res.send('Hello google home!!');
})

app.get('/matches',function(req,res){
  feed.load(cricketURI,function(err,rss){
      res.send(rss);
  });

})

app.get('/matches/:team/summary',function(req,res){
  res.send('Get '+req.params.team+' score summary');
})

app.get('/matches/:team/detail',function(req,res){
  res.send('Get '+req.params.team+' score detail');
})

app.listen(app.get('port'),function(){
  console.log("googlehomecricket app is running at localhost:8054");
})
