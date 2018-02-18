const player = require('../../music/musicPlayer')

module.exports = {
    name: "queue",
    description: "Sends the queue list in chat.",
    parameters: [],
    handle: function(message, params, client) {
        player.queue(message, message.channel, client);
    }
}