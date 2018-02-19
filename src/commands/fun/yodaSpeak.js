const YodaSpeak = require('yoda-speak'),
    yoda = new YodaSpeak("QGOXQtQCgkmshQZ216bcDj8RaRX4p1yguhIjsn88GLh3e3Iybw")

let state = false // enabled
let client = undefined

let prepareClient = (newClient) => {
    this.client = newClient
    newClient.on("message", message => {
        if (state) {
            message.delete().then(() => {
                let response = yoda.convert(message.content)
                message.channel.send(message.author + " " + response)
            }).catch(() => {
                message.reply("To talk like yoda failed!")
            })
        }
    })
}

module.exports = {
    name: "yodaSpeak",
    description: "Turns chat into Yoda mode.",
    handle: function(message, params, client) {
        if (state) {
            message.reply("The chat is no longer yoda :(")
            state = false
        } else {
            message.reply("The chat is now yoda mode!!!!!!")

            prepareClient(client)

            state = true
        }
    }
}