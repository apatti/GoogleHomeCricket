var ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
var express = require('express');
let bodyParser = require('body-parser');
var controller = require('./controller');
var app = express();
app.set('port', (process.env.PORT || 8054));
app.use(bodyParser.json({type: 'application/json'}));

const SUMMARY_INTENT = 'matches';
const MATCHES_INTENT = 'gamesummary';

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

app.post('/',function(req,res){
  const assistant = new ApiAiAssistant({request: request, response: response});

  function matchesIntent(assistant)
  {
    assistant.tell('List of matches for today are:');
  }

  function matchSummary(assistant)
  {
    assistant.tell('Match summary web');
  }

  let actionMap = new Map();
  actionMap.set(MATCHES_INTENT, matchesIntent);
  actionMap.set(SUMMARY_INTENT, matchSummary);
  assistant.handleRequest(actionMap);
});


app.get('/matches/:team/detail',function(req,res){
  res.send('Get '+req.params.team+' score detail');
})

app.listen(app.get('port'),function(){
  console.log("googlehomecricket app is running at localhost:8054");
})
