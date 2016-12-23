var ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
var express = require('express');
let bodyParser = require('body-parser');
var controller = require('./controller');
var app = express();
app.set('port', (process.env.PORT || 8054));
app.use(bodyParser.json({type: 'application/json'}));

const SUMMARY_INTENT = 'gamesummary';
const MATCHES_INTENT = 'matches';

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
  const assistant = new ApiAiAssistant({request: req, response: res});

  function matchesIntent(assistant)
  {
    controller.allGames(function(rss){
      let text_speech = '<speak><p><s>Current live games are:</s><break/>';
      for(var game of rss)
      {
        var teams = game.split(' v ');
        text_speech += '<s>'+teams[0]+' versus '+teams[1]+'</s><break/>';
      }
      text_speech += '</speak>'
      assistant.tell(text_speech);
    });
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
