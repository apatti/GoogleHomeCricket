var feed = require('rss-to-json');
var cricketURI = "http://static.cricinfo.com/rss/livescores.xml";
var request = require('request');
var gameRegex = /[^a-zA-Z ]+/g
var stringSimilarity = require('string-similarity');
var cheerio = require('cheerio');

function getAllGames(callback){
  feed.load(cricketURI,function(err,rss){
      var games = [];
      for(var game of rss.items)
      {
        title = game.title.replace(gameRegex,'');
        title = title.replace(/\s\s+/g, ' ');
        games.push(title);
      }
      callback(games);
  });
}

function getTeams(title)
{
  title = title.replace(gameRegex,'');
  teams = title.split(' v ');
  return teams.map(s=>s.trim(s));
  //teams.push(...getTeams(game.title));
}

function getTeamMatchMap(games){
  var teamMap = {};
  for (var game of games){
    title = game.title.replace(gameRegex,'');
    teams = title.split(' v ');
    teams = teams.map(s=>s.trim(s));
    teamMap[teams[0]] = {link:game.url,title:title};
    teamMap[teams[1]] = {link:game.url,title:title};
  }
  return teamMap;
}

function getScoreHtml(link,callback){
  request(link,function(err,response,html){
    if(!err){
      callback(html);
    }
  });
}

function getScoreSummary(gameObj,callback)
{
  var html = getScoreHtml(gameObj.link+"&view=scorecard",function(html){
    var $ = cheerio.load(html);
    var summary,team1,team2;
    $('.innings-requirement').filter(function(){
      var data = $(this);
      summary = data.text().replace(/[\n\t\r]/g,"").trim();
    });
    $('.team-1-name').filter(function(){
      team1 = getTeamSummaryObj($(this));
    });
    $('.team-2-name').filter(function(){
      team2 = getTeamSummaryObj($(this));
    });

    callback({summary:summary,team1:team1,team2:team2});
  });
}

function getTeamSummaryObj(data)
{
  var name = data.text().replace(/[\n\t\r]/g,"");
  var score = data.children().text();
  name = name.replace(score,"");
  return {name:name.trim(),score:score};
}

function getGameSummary(team,callback){
  // feed.load(cricketURI,function(err,rss){
  //   var summary = {}
  //   var teamMap = getTeamMatchMap(rss.items);
  //   var teamMatchObj = stringSimilarity.findBestMatch(team,Object.keys(teamMap));
  //   //console.log(teamMatchObj)
  //   if(teamMatchObj.bestMatch.rating<=0.3)
  //   {
  //     callback({});
  //     return;
  //   }
  //   getScoreSummary(teamMap[teamMatchObj.bestMatch.target],function(summary){
  //     callback(summary);
  //   });
  // });
  getGameObj(team,function(matchObj){
    if(matchObj==null)
    {
      callback(null);
      return;
    }
    getScoreSummary(teamMap[teamMatchObj.bestMatch.target],function(summary){
      callback(summary);
    });
  });
}

function getBattingDetails(team,callback){
  getGameObj(team,function(matchObj){
    if(matchObj==null)
    {
      callback(null);
      return;
    }
  });
}

function getGameObj(team,callback){
  feed.load(cricketURI,function(err,rss){
    var summary = {}
    var teamMap = getTeamMatchMap(rss.items);
    var teamMatchObj = stringSimilarity.findBestMatch(team,Object.keys(teamMap));
    //console.log(teamMatchObj)
    if(teamMatchObj.bestMatch.rating<=0.3)
    {
      callback(null);
      return;
    }
    callback(teamMap[teamMatchObj.bestMatch.target]);
  });
}


module.exports = {
  allGames : getAllGames,
  gameSummary: getGameSummary
}
