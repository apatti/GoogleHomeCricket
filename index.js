var ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
var express = require('express');
let bodyParser = require('body-parser');
var controller = require('./controller');
var app = express();
app.set('port', (process.env.PORT || 8054));
app.use(bodyParser.json({type: 'application/json'}));

const SUMMARY_INTENT = 'gamesummary';
const MATCHES_INTENT = 'matches';
const IS_TEAM_PLAYING_INTENT = 'isteamplaying';

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
      let text_speech = '<speak><p><s>Current live games are:</s><break time="1s"/>';
      for(var game of rss)
      {
        var teams = game.split(' v ');
        text_speech += '<s>'+teams[0]+' versus '+teams[1]+'</s><break time="1s"/>';
      }
      text_speech += '</p></speak>'
      assistant.tell(text_speech);
    });
  }

  function matchSummary(assistant)
  {
    controller.gameSummary(assistant.getArgument('team'),function(summaryObj)
    {
      let text_speech='<speak>';
      if(!('summary' in summaryObj))
      {
        text_speech += '<speak>Sorry, '+assistant.getArgument('team')+' is not playing any game now <break time="1s"/> </speak>'
      }
      else {

        text_speech += '<p><s>'+summaryObj.summary+'</s><break time="1s"/>';
        if(summaryObj.team1.score!=="")
        {
          text_speech += '<s>'+summaryObj.team1.name+' score is '+summaryObj.team1.score+'</s><break time="1s"/>';
        }
        if(summaryObj.team2.score!=="")
        {
          text_speech += '<s>and '+summaryObj.team2.name+' score is '+summaryObj.team2.score+'</s><break time="1s"/>';
        }
      }
      text_speech += '</speak>';
      assistant.tell(text_speech);

    });
  }

  function getScoreInSpeech(score)
  {
    var scoreSpeech = '';
    if(score.indexOf('&'))
    {
      scoreList = score.split('&');
    }
  }

  function isTeamPlaying(assistant)
  {
    controller.gameSummary(assistant.getArgument('team'),function(summaryObj)
    {
      var team = assistant.getArgument('team');
      let text_speech='<speak>';
      if(!('summary' in summaryObj))
      {
        text_speech += 'Sorry, '+team+' is not playing any game now <break time="1s"/>'
      }
      else {

        text_speech += '<p><s>Yes, the '+team+' is playing <break time="500ms"/> and the match summary is:</s><s>'+summaryObj.summary+'. </s><break time="1s"/>';
        if(summaryObj.team1.score!=="")
        {
          text_speech += '<s>'+summaryObj.team1.name+' score is '+summaryObj.team1.score+'</s><break time="1s"/>';
        }
        if(summaryObj.team2.score!=="")
        {
          text_speech += '<s>and '+summaryObj.team2.name+' score is '+summaryObj.team2.score+'</s><break time="1s"/>';
        }
      }
      text_speech += '</speak>';
      assistant.tell(text_speech);

    });
  }

  let actionMap = new Map();
  actionMap.set(MATCHES_INTENT, matchesIntent);
  actionMap.set(SUMMARY_INTENT, matchSummary);
  actionMap.set(IS_TEAM_PLAYING_INTENT,isTeamPlaying)
  assistant.handleRequest(actionMap);
});


app.listen(app.get('port'),function(){
  console.log("googlehomecricket app is running at localhost:8054");
})
