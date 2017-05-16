const Discord = require('discord.js');

module.exports = {
    join: function(message, channel, client) {
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
    }
};