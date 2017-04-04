module.exports = {
    shutdown: function (client) {
        for (c in client.voiceChannels) {
            let channel = client.voiceChannels[c];
            if (channel === undefined) {
                continue;
            }
            channel.leave();
        }
    }
};