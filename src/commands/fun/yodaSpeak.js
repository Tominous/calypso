const calypso = require('../../calypso')

console.log(calypso)

module.exports = {
    name: "yodaSpeak",
    description: "Turns chat into Yoda mode.",
    handle: function(message, params, client) {
        calypso.fetchModule("yodaSpeak").then((mod) => {
            if (mod.state) {
                mod.disable(client)
                message.reply("The chat is no longer youda :(")
            } else {
                mod.enable(client)
                message.reply("The chat is now yoda mode!!!!!!")
            }
        })
    }
}