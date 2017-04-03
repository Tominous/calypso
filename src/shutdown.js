module.exports = {
    shutdown: function (client) {
        for (c in client.voiceChannels) {
            let channel = client.voiceChannels[c];
            channel.leave();
        }
    }
};