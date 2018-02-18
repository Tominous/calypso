const player = require('../../music/musicPlayer')

module.exports = {
    name: "play",
    description: "Searches for a video on youtube and adds it to the queue.",
    parameters: ["query"],
    handle: function(message, params, client) {
        player.play(message, message.channel, client);
    }
}