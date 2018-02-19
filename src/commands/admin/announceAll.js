module.exports = {
    name: "announceAll",
    description: "Announces to all servers",
    params: ["text"],
    ownerOnly: true,
    handle: function(message, params, client) {
        message.reply("REEE")
    }
}