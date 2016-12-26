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
const WELCOME_INTENT = 'input_welcome';
const WHO_GOT_OUT_INTENT='whogotout';

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


app.get('/matches/:team/battingOut',function(req,res){
  controller.getBattingDetails(req.params.team,function(outbatsmanObj,strikebatsmanObj)
  {
    var outbatsman=[]
    for(var batsman of outbatsmanObj)
    {
      var batsmanRegex = /([a-zA-Z ]+)([0-9]+)/g
      var batsmanMatches = batsmanRegex.exec(batsman);
      outbatsman.push({name:batsmanMatches[1].replace(/\s*$/,""),score:batsmanMatches[2]});
    }

    var strikebatsman=[]
    for(var batsman of strikebatsmanObj)
    {
      var batsmanRegex = /([a-zA-Z ]+)([0-9]+)\*/g
      var batsmanMatches = batsmanRegex.exec(batsman);
      strikebatsman.push({name:batsmanMatches[1].replace(/\s*$/,""),score:batsmanMatches[2]});
    }
    res.send({"outbatsman":outbatsman,"strikebatsman":strikebatsman});
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
      assistant.ask(text_speech);
    });
  }

  function matchSummary(assistant)
  {
    controller.gameSummary(assistant.getArgument('team'),function(summaryObj)
    {
      var text_speech='<speak>';
      if(!('summary' in summaryObj))
      {
        text_speech += '<speak>Sorry, '+assistant.getArgument('team')+' is not playing any game now <break time="1s"/> </speak>'
      }
      else {
        text_speech += getSummarySpeech(summaryObj);
      }
      text_speech += '</speak>';
      assistant.ask(text_speech);

    });
  }

  function welcome(assistant)
  {
      let speech = '<speak><p><s>Hi, welcome to Cricket Scores.<break time="1s"/></s>';
      speech += '<s>You can: Get live summary of any cricket game. <break time="500ms"/></s>';
      speech += '<s>Check if a team is currently playing or not. <break time="500ms"/></s>';
      //speech += '<s>Get full details of a live game. <break time="500ms"/></s>';
      speech += '<s>Get list of games happening today.</s> <break time="500ms"/>';
      speech += '</p></speak>';
      assistant.ask(speech);
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
        text_speech += '<s>Yes, the '+team+' is playing <break time="500ms"/> and the match summary is:</s><s>'+getSummarySpeech(summaryObj);
      }
      text_speech += '</speak>';
      assistant.ask(text_speech);
    });
  }

  function whogotout(assistant)
  {
    var team = assistant.getArgument('team');
    if(team==null)
    {
      team = assistant.data['team'];
    }
    if(team == null)
    {
      assistant.ask("Sure, please let me know the team name?");
      return;
    }
    controller.getBattingDetails(team,function(outbatsman,strikebatsman){
      var outbatsman=[]
      for(var batsman of outbatsmanObj)
      {
        var batsmanRegex = /([a-zA-Z ]+)([0-9]+)/g
        var batsmanMatches = batsmanRegex.exec(batsman);
        outbatsman.push({name:batsmanMatches[1].replace(/\s*$/,""),score:batsmanMatches[2]});
      }
      var strikebatsman=[]
      for(var batsman of strikebatsmanObj)
      {
        var batsmanRegex = /([a-zA-Z ]+)([0-9]+)\*/g
        var batsmanMatches = batsmanRegex.exec(batsman);
        strikebatsman.push({name:batsmanMatches[1].replace(/\s*$/,""),score:batsmanMatches[2]});
      }
      assistant.tell(getWhoOutInSpeech(outbatsman,strikebatsman));
    });
  }

  function getSummarySpeech(summaryObj)
  {
    var text_speech = '<p><s>'+summaryObj.summary+'.<break time="1s"/></s>';
    if(summaryObj.team1.score!=="")
    {
      text_speech += '<s>'+summaryObj.team1.name+' score is '+getScoreInSpeech(summaryObj.team1.score)+'.</s><break time="1s"/>';
    }
    if(summaryObj.team2.score!=="")
    {
      text_speech += '<s>'+summaryObj.team2.name+' score is '+getScoreInSpeech(summaryObj.team2.score)+'</s>';
    }
    text_speech+='</p>';
    return text_speech;
  }

  function getScoreInSpeech(score)
  {
    var scoreSpeech = '';
    if(score.indexOf('&'))
    {
      scoreList = score.split('&');
      var teamIndex = 0;
      for(var teamScore of scoreList)
      {
        let teamScoreSpeech = getRunsWicketsInSpeech(teamScore);
        if(teamScoreSpeech==null)
        {
          return null;
        }
        if(teamIndex!=0)
        {
          scoreSpeech += ' in first innings <break time="500ms"/> and in second innings their score is ';
        }
        scoreSpeech+=teamScoreSpeech;

        teamIndex++;
      }
    }
    else {
      scoreSpeech = getRunsWicketsInSpeech(score);
    }
    return scoreSpeech;
  }

  function getRunsWicketsInSpeech(score)
  {
    var speech = '';
    var scoreRunsRegex = /([0-9]+)((\/)?([0-9]+)?( )?\(?([0-9.]+)?( ov\))?)?/g;
    let scoreRegexMatches = scoreRunsRegex.exec(score);
    // index 1 is runs.
    // index 4 is wickets
    // index 6 is overs
    if(scoreRegexMatches==null)
    {
      return null;
    }
    speech = ' '+scoreRegexMatches[1]+'<break time="500ms"/>';
    if(scoreRegexMatches[4]!=null)
    {
      if(scoreRegexMatches[4]==0)
      {
        speech += ' no loss <break time="500ms"/>';
      }
      else if(scoreRegexMatches[4]==10)
      {
        speech += ' all out <break time="500ms"/>';
      }
      else
      {
        speech += ' for loss of '+scoreRegexMatches[4]+' wickets <break time="500ms"/>';
      }
    }

    if(scoreRegexMatches[6]!=null)
    {
      speech += ' in '+scoreRegexMatches[6]+' overs.'
    }
    speech += '<break time="1s"/>'
    return speech;
  }

  function getWhoOutInSpeech(outbatsman, strikebatsman)
  {
    var speech = '<speak>Currently: <break time="500ms"/> ';
    var index = 0;
    for(var batsman of strikebatsman)
    {
      speech +=  batsman.name + " is batting, he scored " + batsman.score + ' runs <break time="500ms"/>'
      if(index==0)
      {
        speech += ' and ';
      }
      else {
        speech += ' and <break time="1s"/>';
      }
      index ++ ;
    }

    if(outbatsman.length==0)
    {
      speech += 'no one is out!!<break time="1s"/></speak>';
      return speech;
    }
    speech += 'following folks are out:<break time="500ms"/>';
    for(var batsman of outbatsman)
    {
      speech += batsman.name+' <break time="750ms"/>, he scored ' + batsman.score + ' runs<break time="500ms"/>.';
    }
    speech +='</speak>';
    return speech;
  }

  let actionMap = new Map();
  actionMap.set(MATCHES_INTENT, matchesIntent);
  actionMap.set(SUMMARY_INTENT, matchSummary);
  actionMap.set(IS_TEAM_PLAYING_INTENT,isTeamPlaying)
  actionMap.set(WELCOME_INTENT,welcome);
  actionMap.set(WHO_GOT_OUT_INTENT,whogotout);
  assistant.handleRequest(actionMap);
});


app.listen(app.get('port'),function(){
  console.log("googlehomecricket app is running at localhost:8054");
})
