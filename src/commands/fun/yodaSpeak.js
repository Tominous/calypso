const YodaSpeak = require('yoda-speak'),
    yoda = new YodaSpeak("QGOXQtQCgkmshQZ216bcDj8RaRX4p1yguhIjsn88GLh3e3Iybw")

module.exports = {
    name: "yodaSpeak",
    description: "Turns chat into Yoda Speak.",
    handle: function(message, params, client) {
        params.shift()
        let text = params.join(" ")
        yoda.convert(text, function(err, result) {
            if (!err) {
                message.reply("`" + result + "`")
            } else {
                message.reply("To talk like yoda failed!")
            }
        })
    }
}