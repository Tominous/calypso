const player = require('../../music/musicPlayer')

module.exports = {
    name: "skip",
    description: "Skips the current song and plays the next one on the queue.",
    parameters: [],
    handle: function(message, params, client) {
        player.skip(message, message.channel, client);
    }
}