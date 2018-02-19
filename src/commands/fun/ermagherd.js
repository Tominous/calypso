const ermagherd = require('node-ermahgerd')

module.exports = {
    name: "ermagherd",
    description: "Translates your text into ermagherd",
    params: ["text"],
    handle: function(message, params, client) {
        let text = params.shift().join(" ")
        let translation = ermagherd.translate(text)
        message.reply(translation)
    }
}