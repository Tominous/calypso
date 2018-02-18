const player = require('../../music/musicPlayer')

module.exports = {
    name: "join",
    description: "Joins voice channel.",
    parameters: [],
    handle: function(message, params, client) {
        player.join(message, message.channel, client)
    }
}