const player = require('../../music/musicPlayer')

module.exports = {
    name: "leave",
    description: "Leaves voice channel.",
    parameters: [],
    handle: function(message, params, client) {
        player.leave(message, message.channel, client);
    }
}