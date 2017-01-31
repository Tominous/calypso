const Discord = require('discord.js'),
 youtubeStream = require("youtube-audio-stream"),
 ytSearch = require("youtube-search");

 var ytOpts = {
   maxResults: 1,
   key: "AIzaSyAKjDQOtjKq0NMkD31P07TohtcsrFCLkrE"
 };

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

var handler = {};

handler.commands = ["help","joinchannel","leavechannel","playmusic","stopmusic","setvolume"];

handler.handle = function(message, content, author, member, channel, client) {
  let cmd = content[0].replace("~", "");

  switch (cmd) {
    case "help":
      var embed = new Discord.RichEmbed().setTitle("------ > HELP < ------");

      embed.addField("- Commands", handler.commands.join(", "));

      channel.sendEmbed(embed);
      break;
    case "joinchannel":
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
        channel.sendMessage(author + " Joined " + finalChannel.name);

        client.voiceChannels[channel.guild.id] = finalChannel;
        client.voiceConnections[channel.guild.id] = connection;
        client.guildQueues[channel.guild.id] = [];
      });
      break;
    case "leavechannel":
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
    case "playmusic":
      if (client.voiceChannels[channel.guild.id] === undefined) {
        channel.sendMessage(author + " I'm not on a channel. Do ~joinchannel first!");
        return;
      }

      var streamOptions = { seek: 0, volume: 1 };

      var search = content.slice(1);
      if (search.length <= 0) {
        errorUsage("~playmusic <name of video>", function(embed) {
          channel.sendEmbed(embed);
        });
        return;
      }
      var realSearch = search.join(" ");
      ytSearch(realSearch, ytOpts, function(err, results) {
        if (err) {
          console.log(err);
          channel.sendMessage(author + " There was an error!");
          return;
        }

        if (results.length <= 0) {
          channel.sendMessage(author + " No videos found!");
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

        var stream = youtubeStream(result.link);
        var dispatcher = client.voiceConnections[channel.guild.id].playStream(stream, streamOptions);

        var embed = new Discord.RichEmbed().setTitle(result.title).setURL(result.link);
        embed.addField("Description", result.description);
        if (result.thumbnails['high'] !== null || result.thumbnails['high'] !== undefined) {
          embed.setThumbnail(result.thumbnails['high'].url);
        }

        channel.sendMessage(author + " Now playing: ");
        channel.sendEmbed(embed);

        client.voiceDispatchers[channel.guild.id] = dispatcher;

        dispatcher.on("end", () => {
          if (client.guildQueues[channel.guild.id].length > 0) {
            var shifted = client.guildQueues[channel.guild.id].shift();

            var stream = youtubeStream(result.link);
            var dispatcher = client.voiceConnections[channel.guild.id].playStream(stream, streamOptions);
            client.voiceDispatchers[channel.guild.id] = dispatcher;

            var embed = new Discord.RichEmbed().setTitle(shifted.title).setURL(shifted.link);
            embed.addField("Description", shifted.description);

            channel.sendMessage(author + " Now playing: ");
            channel.sendEmbed(embed);
          } else {
            client.voiceDispatchers[channel.guild.id] = undefined;
          }
        });
      });

      break;
    case "stopmusic":
      if (client.voiceChannels[channel.guild.id] === undefined) {
        channel.sendMessage(author + " I'm not on a channel. Do ~joinchannel first!");
        return;
      }

      if (client.voiceDispatchers[channel.guild.id] === undefined) {
        channel.sendMessage(author + " I'm not playing anything!");
        return;
      }

      client.voiceDispatchers[channel.guild.id].end();
      break;
    case "setvolume":
      if (client.voiceChannels[channel.guild.id] === undefined) {
        channel.sendMessage(author + " I'm not on a channel. Do ~joinchannel first!");
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
  }
};

module.exports = handler;
