const Discord = require('discord.js'),
    ytdl = require("ytdl-core"),
    ytSearch = require("youtube-search"),
    config = require("../config.json"),
    fetchInfo = require("youtube-info");

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
            let embed = new Discord.RichEmbed().setTitle(":musical_note: Music").setColor("#69d5ea");
            embed.addField("Now Playing", shifted.title);
            if (shifted.thumbnails['high'] !== null || shifted.thumbnails['high'] !== undefined) {
                embed.setThumbnail(shifted.thumbnails['high'].url);
            }
            embed.setFooter("Enjoy your music!");

            channel.sendEmbed(embed).catch(function () {
                channel.send(":musical_note: Now playing: " + shifted.title);
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
    play: async function(message, channel, client) {
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
        ytSearch(search, ytOpts, async function (err, results) {
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
            let videoId = result.id;
            let fetchResult = await fetchInfo(videoId);
            let {duration} = fetchResult;
            result.duration = duration;

            if (client.guildQueues[channel.guild.id].length > 0 || client.voiceDispatchers[channel.guild.id] !== undefined) {
                client.guildQueues[channel.guild.id].push(result);

                message.reply(":notes: Queued (" + client.guildQueues[channel.guild.id].length + "): " + result.title);
                return;
            }

            try {
                let dispatcher = client.voiceConnections[channel.guild.id].playStream(ytdl(result.link, {filter: 'audioonly'}), {
                    seek: 0,
                    volume: 1
                });

                console.log(result)

                let embed = new Discord.RichEmbed().setTitle(":musical_note: Music").setColor("#69d5ea");
                embed.addField("Now Playing", result.title, false);
                embed.addField("Duration", result.duration.toString().toHHMMSS(), true)
                embed.addField("Channel", result.channel)
                if (result.thumbnails['high'] !== null || result.thumbnails['high'] !== undefined) {
                    embed.setThumbnail(result.thumbnails['high'].url);
                }
                embed.setFooter("Requested by " + message.author.username, message.author.avatarURL);

                channel.sendEmbed(embed).catch(function () {
                    channel.send(":musical_note: Now playing: " + result.title);
                });

                client.voiceDispatchers[channel.guild.id] = dispatcher;
                appendMethod(dispatcher, channel, client);
            } catch (exception) {
                channel.send(":x: Failed to query. Contact @erik#0001");
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
            let embed = new Discord.RichEmbed()
            embed.setColor("#42f4b0")
                .setTitle("Player Queue")
                .setFooter("Requested by " + message.author.username, message.author.avatarURL)
            let msg = "**Music Player Queue**\n";
            let counter = 0;
            for (let que in client.guildQueues[channel.guild.id]) {
                counter++;
                let m = client.guildQueues[channel.guild.id][que];
                let actualMessage = counter + ". " + m.title + "\n";
                msg += actualMessage;
            }
            embed.setDescription(msg)
            channel.send(embed).catch(e => {
                message.reply("Failed to send queue: " + e)
            })
        } else {
            message.reply("Nothing on the queue! Do ~play to add some music to the queue!");
        }
    }
};