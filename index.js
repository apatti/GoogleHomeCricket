var express = require('express');
var app = express();
var controller = require('./controller');
app.set('port', (process.env.PORT || 8054));

app.get('/',function(req,res){
  res.send('Hello google home!!');
})

app.get('/matches',function(req,res){
  controller.allGames(function(rss) {
    res.send(rss);
  })
})

app.get('/matches/:team/summary',function(req,res){
  controller.gameSummary(req.params.team,function(summary)
  {
      res.send(summary);
  });

})

app.get('/matches/:team/detail',function(req,res){
  res.send('Get '+req.params.team+' score detail');
})

app.listen(app.get('port'),function(){
  console.log("googlehomecricket app is running at localhost:8054");
})
