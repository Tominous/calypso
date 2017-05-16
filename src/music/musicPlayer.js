const Discord = require('discord.js'),
    ytdl = require("ytdl-core"),
    ytSearch = require("youtube-search"),
    config = require("../config.json");

let ytOpts = {
    maxResults: 1,
    key: config.apis.youtube
};

let appendMethod = function (dispatcher, channel, client) {
    dispatcher.on("end", () => {
        if (client.voiceDispatchers[channel.guild.id] === undefined) {
            return;
        }

        if (client.guildQueues[channel.guild.id].length > 0) {
            let shifted = client.guildQueues[channel.guild.id].shift();
            let dispatcher = client.voiceConnections[channel.guild.id].playStream(ytdl(shifted.link, {filter: 'audioonly'}), {
                seek: 0,
                volume: 1
            });
            let embed = new Discord.RichEmbed().setTitle(shifted.title).setURL(shifted.link);
            embed.addField("Description", shifted.description);

            channel.send(":musical_note: **Now playing:**");
            channel.send(embed).catch(function () {
                console.log("Promise failed, sending default message");
                channel.send(shifted.title);
            });

            client.voiceDispatchers[channel.guild.id] = dispatcher;
            appendMethod(dispatcher, channel, client);
        } else {
            client.voiceDispatchers[channel.guild.id] = undefined;
        }
    });
};

module.exports = {
    join: function(message, channel, client) {
        if (channel instanceof Discord.DMChannel) {
            message.reply("This action can ony be performed in text channels.");
            return;
        }

        let voiceChannel;

        for (let c of channel.guild.channels) {
            let realC = c[1];
            if (realC instanceof Discord.VoiceChannel) {
                if (realC.id === message.member.voiceChannelID) {
                    voiceChannel = realC;
                    break;
                }
            }
        }

        if (voiceChannel === undefined) {
           message.reply("You're not in a voice channel!");
           return false;
        }

        voiceChannel.join().then(connection => {
            message.reply("Joined " + voiceChannel.name + ". Now ready to play music.");

            client.voiceChannels[channel.guild.id] = voiceChannel;
            client.voiceConnections[channel.guild.id] = connection;
            client.guildQueues[channel.guild.id] = [];

            client.mongo.collection("voice_log").insertOne({
                "guild": message.guild.id,
                "region": message.guild.region,
                "joined_at": new Date().getTime()
            });
        });
        return true;
    },
    leave: function(message, channel, client) {
        if (channel instanceof Discord.DMChannel) {
            message.reply("This action can ony be performed in text channels.");
            return;
        }

        if (client.voiceChannels[channel.guild.id] === undefined) {
            message.reply("I'm not connected to a voice channel");
            return;
        }

        message.reply("Left voice channel.");
        client.voiceChannels[channel.guild.id].leave();
        client.voiceChannels[channel.guild.id] = undefined;
        client.voiceDispatchers[channel.guild.id] = undefined;
        client.voiceConnections[channel.guild.id] = undefined;
        client.guildQueues[channel.guild.id] = undefined;
    },
    play: function(message, channel, client) {
        if (channel instanceof Discord.DMChannel) {
            message.reply("This action can ony be performed in text channels.");
            return;
        }

        if (client.voiceChannels[channel.guild.id] === undefined) {
            message.reply("I'm not on a channel. Do ~join first!");
            return;
        }

        let text = message.content.split(" ");
        let search = text.slice(1).join(" ");
        ytSearch(search, ytOpts, function (err, results) {
            if (err !== null) {
                console.log(err);
                message.reply("There was an error! Please contact @Erik#9933 about this issue.");
                return;
            }

            if (results.length <= 0) {
                message.reply("No videos found! Try a different query?");
                return;
            }

            let result = results[0];

            if (client.guildQueues[channel.guild.id].length > 0 || client.voiceDispatchers[channel.guild.id] !== undefined) {
                client.guildQueues[channel.guild.id].push(result);

                let embed = new Discord.RichEmbed().setTitle(result.title).setURL(result.link);
                embed.addField("Description", result.description);

                message.reply("Queued (" + client.guildQueues[channel.guild.id].length + "): ");
                channel.send(embed).catch(function () {
                    console.log("Promise failed, sending default queue message");
                    channel.send(result.title);
                });
                return;
            }

            try {
                let dispatcher = client.voiceConnections[channel.guild.id].playStream(ytdl(result.link, {filter: 'audioonly'}), {
                    seek: 0,
                    volume: 1
                });

                let embed = new Discord.RichEmbed().setTitle(result.title).setURL(result.link);
                embed.addField("Description", result.description);
                if (result.thumbnails['high'] !== null || result.thumbnails['high'] !== undefined) {
                    embed.setThumbnail(result.thumbnails['high'].url);
                }

                channel.send(":musical_note: **Now playing:** ");
                channel.send(embed).catch(function () {
                    console.log("Promise failed, sending default message");
                    channel.send(result.title);
                });

                client.voiceDispatchers[channel.guild.id] = dispatcher;
                appendMethod(dispatcher, channel, client);
            } catch (exception) {
                channel.send(":x: Failed to query. Contact @Erik#9933");
                console.log(exception);
            }
        });
    },
    skip: function(message, channel, client) {
        if (channel instanceof Discord.DMChannel) {
            message.reply("This action can ony be performed in text channels.");
            return;
        }

        if (client.voiceChannels[channel.guild.id] === undefined) {
            message.reply("I'm not on a channel. Do ~join first!");
            return;
        }

        if (client.voiceDispatchers[channel.guild.id] === undefined) {
            message.reply("I'm not playing anything!");
            return;
        }

        message.reply(":x: Skipped song.");
        client.voiceDispatchers[channel.guild.id].end();
    },
    queue: function(message, channel, client) {
        if (channel instanceof Discord.DMChannel) {
            message.reply("This action can ony be performed in text channels.");
            return;
        }

        if (client.voiceChannels[channel.guild.id] === undefined) {
            message.reply("I'm not on a channel. Do ~join first!");
            return;
        }

        if (client.guildQueues[channel.guild.id].length > 0) {
            let msg = "```\n";
            let counter = 0;
            for (let que in client.guildQueues[channel.guild.id]) {
                counter++;
                let m = client.guildQueues[channel.guild.id][que];
                let actualMessage = "#" + counter + " " + m.title;
                msg += actualMessage + "\n";
            }
            msg += "```";
            channel.send(msg);
        } else {
            message.reply("Nothing on the queue! Do ~play to add some music to the queue!");
        }
    }
};