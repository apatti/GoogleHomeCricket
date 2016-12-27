var feed = require('rss-to-json');
var cricketURI = "http://static.cricinfo.com/rss/livescores.xml";
var request = require('request');
var gameRegex = /[^a-zA-Z ]+/g
var stringSimilarity = require('string-similarity');
var cheerio = require('cheerio');
var cricketBase = 'http://www.espncricinfo.com';
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

function getScoreSummaryOld(gameObj,callback)
{
  getScoreHtml(gameObj.link+"&view=scorecard",function(html){
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

function getScoreSummary(gameObj,callback)
{
  getScoreHtml(gameObj.link,function(html){
    var $ = cheerio.load(html);
    var wicketsUrl=$('.inline-list.commentary-main-events-links').children().filter(function(i,el){
      return $(this).attr('class')==='remove-border-right';
    }).children().first().attr('href');

    getScoreHtml(cricketBase+wicketsUrl,function(html){
        var $ = cheerio.load(html);
        var strikebatsman = [];
        var currentBowlers = [];
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
        $('.large-7.medium-7.columns.text-right.match-information').filter(function(){
          $(this).children().each(function(i,elem){
            if($(this).text().indexOf('*')!=-1)
            {
              strikebatsman.push($(this).text());
            }
            else {
              currentBowlers.push($(this).text());
            }
          });
        });
        callback({summary:summary,team1:team1,team2:team2,strikebatsman:strikebatsman,currentBowlers:currentBowlers});
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
    getScoreHtml(matchObj.link,function(html){
      var $ = cheerio.load(html);
      var wicketsUrl=$('.inline-list.commentary-main-events-links').children().filter(function(i,el){
        return $(this).attr('class')==='remove-border-right';
      }).children().first().attr('href');

      getScoreHtml(cricketBase+wicketsUrl,function(html){
          var $ = cheerio.load(html);
          var outbatsman = [];
          var strikebatsman = [];
          $('.comments-link-list').find('li').each(function(i,e){
            var text = $(this).text();
            if(['Fours','Sixes','Wickets'].indexOf(text)==-1 && text.indexOf('/')==-1)
            {
              if(text.indexOf('*')!=-1)
              {
                strikebatsman.push(text);
              }
              else
              {
                outbatsman.push(text);
              }
            }
          });
          callback(outbatsman,strikebatsman);
      });
    });
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
  getGameObj(team,function(matchObj){
    if(matchObj==null)
    {
      callback(null);
      return;
    }
    getScoreSummary(matchObj,function(summary){
      callback(summary);
    });
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
  gameSummary: getGameSummary,
  getBattingDetails: getBattingDetails
}
