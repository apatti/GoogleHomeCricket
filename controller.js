var feed = require('rss-to-json');
var cricketURI = "http://static.cricinfo.com/rss/livescores.xml";
var request = require('request');
var gameRegex = /[^a-zA-Z ]+/g

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

function getGameSummary(team,callback){
  feed.load(cricketURI,function(err,rss){
    
  });
}

module.exports = {
  allGames : getAllGames
}
