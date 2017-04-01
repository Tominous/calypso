const Discord = require('discord.js'),
 youtubeStream = require("youtube-audio-stream"),
 ytSearch = require("youtube-search"),
 ghdownload = require("github-download");

 var ytOpts = {
   maxResults: 1,
   key: "AIzaSyAKjDQOtjKq0NMkD31P07TohtcsrFCLkrE"
 };

 var streamOptions = { seek: 0, volume: 1 };

var dispatcherByGuild = [];

String.prototype.toHHMMSS = function () {
    var sec_num = parseInt(this, 10);
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) { hours   = "0"+hours; }
    if (minutes < 10) { minutes = "0"+minutes; }
    if (seconds < 10) { seconds = "0"+seconds; }
    return hours + ':' + minutes + ':' + seconds;
}

var getValue = function(percentage, callback) {
  var max = 1;
  var real = (percentage * max) / 100;

  callback(real);
}

var errorUsage = function(usage, callback) {
  var embed = new Discord.RichEmbed().setColor("#ff3535");
  embed.addField("Error", "Wrong usage!", true);
  embed.addField("Correct Usage", usage, true);

  callback(embed);
}

var appendMethod = function(dispatcher, channel, client) {
  dispatcher.on("end", () => {
    if (client.guildQueues[channel.guild.id].length > 0) {
      var shifted = client.guildQueues[channel.guild.id].shift();

      var stream = youtubeStream(shifted.link);
      var dispatcher = client.voiceConnections[channel.guild.id].playStream(stream, streamOptions);
      client.voiceDispatchers[channel.guild.id] = dispatcher;

      appendMethod(dispatcher, channel, client);

      var embed = new Discord.RichEmbed().setTitle(shifted.title).setURL(shifted.link);
      embed.addField("Description", shifted.description);

      channel.sendMessage(":musical_note: **Now playing:**");
      channel.sendEmbed(embed);
    } else {
      client.voiceDispatchers[channel.guild.id] = undefined;
    }
  });
};

var handler = {};

handler.commands = ["help","join","leave","play","stop","volume","queue"];

handler.handle = function(message, content, author, member, channel, client) {
  let cmd = content[0].replace("~", "");

  switch (cmd) {
    case "help":
      var embed = new Discord.RichEmbed().setTitle("------ > HELP < ------");

      embed.addField("- Commands", handler.commands.join(", "));

      channel.sendEmbed(embed);
      break;
    case "join":
      var finalChannel;

      for (var c of channel.guild.channels) {
        let realC = c[1];
        if (realC instanceof Discord.VoiceChannel) {
          if (realC.id === member.voiceChannelID) {
            finalChannel = realC;
            break;
          }
        }
      }

      if (finalChannel === undefined) {
        channel.sendMessage(author + " You're not in a voice channel!");
        return;
      }

      finalChannel.join().then(connection => {
        channel.sendMessage(author + " Joined " + finalChannel.name + ". Now ready to play music.");

        client.voiceChannels[channel.guild.id] = finalChannel;
        client.voiceConnections[channel.guild.id] = connection;
        client.guildQueues[channel.guild.id] = [];
      });
      break;
    case "leave":
      var finalChannel;

      for (var c of channel.guild.channels) {
        let realC = c[1];
        if (realC instanceof Discord.VoiceChannel) {
          if (realC.id === client.voiceChannels[channel.guild.id].id) {
            finalChannel = realC;
            break;
          }
        }
      }

      if (finalChannel === undefined) {
        channel.sendMessage(author + " I'm not connected to a voice channel!");
        return;
      }

      finalChannel.leave();
      channel.sendMessage(author + " Left " + finalChannel.name);
      client.voiceChannels[channel.guild.id] = undefined;
      client.voiceDispatchers[channel.guild.id] = undefined;
      client.voiceConnections[channel.guild.id] = undefined;
      client.guildQueues[channel.guild.id] = undefined;

      break;
    case "play":
      if (client.voiceChannels[channel.guild.id] === undefined) {
        channel.sendMessage(author + " I'm not on a channel. Do ~join first!");
        return;
      }

      var search = content.slice(1);
      if (search.length <= 0) {
        errorUsage("~play <name of video>", function(embed) {
          channel.sendEmbed(embed);
        });
        return;
      }
      var realSearch = search.join(" ");
      ytSearch(realSearch, ytOpts, function(err, results) {
        if (err) {
          console.log(err);
          channel.sendMessage(author + " There was an error! Please tell @Erik#9933 about this issue.");
          return;
        }

        if (results.length <= 0) {
          channel.sendMessage(author + " No videos found! Try a diferent query?");
          return;
        }

        var result = results[0];

        if (client.guildQueues[channel.guild.id].length > 0 || client.voiceDispatchers[channel.guild.id] !== undefined) {
          client.guildQueues[channel.guild.id].push(result);

          var embed = new Discord.RichEmbed().setTitle(result.title).setURL(result.link);
          embed.addField("Description", result.description);

          channel.sendMessage(author + " Queued (" + client.guildQueues[channel.guild.id].length +  "): ");
          channel.sendEmbed(embed);
          return;
        }

        try {
          var stream = youtubeStream(result.link);
          var dispatcher = client.voiceConnections[channel.guild.id].playStream(stream, streamOptions);

          var embed = new Discord.RichEmbed().setTitle(result.title).setURL(result.link);
          embed.addField("Description", result.description);
          if (result.thumbnails['high'] !== null || result.thumbnails['high'] !== undefined) {
            embed.setThumbnail(result.thumbnails['high'].url);
          }

          channel.sendMessage(":musical_note: **Now playing:** ");
          channel.sendEmbed(embed);

          client.voiceDispatchers[channel.guild.id] = dispatcher;
          appendMethod(dispatcher, channel, client);
        } catch (exception) {
          client.sendMessage(":crossed_swords: Failed to query. Contact @Erik#9933");
        }
      });

      break;
    case "stop":
      if (client.voiceChannels[channel.guild.id] === undefined) {
        channel.sendMessage(author + " I'm not on a channel. Do ~join first!");
        return;
      }

      if (client.voiceDispatchers[channel.guild.id] === undefined) {
        channel.sendMessage(author + " I'm not playing anything!");
        return;
      }

      client.voiceDispatchers[channel.guild.id].end();
      break;
    case "volume":
      if (client.voiceChannels[channel.guild.id] === undefined) {
        channel.sendMessage(author + " I'm not on a channel. Do ~join first!");
        return;
      }

      if (client.voiceDispatchers[channel.guild.id] === undefined) {
        channel.sendMessage(author + " I'm not playing anything!");
        return;
      }

      var vol = parseInt(content.slice(1)[0]);
      if (vol > 100) {
        channel.sendMessage(author + " 100% is the max volume!");
        return;
      }

      getValue(vol, function(real) {
        client.voiceDispatchers[channel.guild.id].setVolume(real);
        channel.sendMessage(author + " Set volume to " + vol + "%");
      });
      break;
    case "queue":
      if (client.guildQueues[channel.guild.id].length > 0) {
        var msg = "```\n";
        var counter = 0;
        for (var que in client.guildQueues[channel.guild.id]) {
          counter++;
          var m = client.guildQueues[channel.guild.id][que];
          var actualMessage = "#" + counter + " " + m.title;
          msg += actualMessage + "\n";
        }
        msg += "```";
        channel.sendMessage(msg);
      } else {
        channel.sendMessage(author + " Nothing on the queue! Do ~playmusic to add some music to the queue!");
      }
      break;
    case "fetch-git":
      ghdownload("git@github.com:erosemberg/calypso.git", process.cwd())
      .on('error', function(err) {
        channel.sendMessage(author + " Failed to download update!");
        console.log(err);
      }).on('end', function() {
        channel.sendMessage(author + " Downloaded latest version!");
      });
      break;
  }
};

module.exports = handler;
