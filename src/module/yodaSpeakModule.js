try {
    const calypso = require("../calypso")
} catch (e) {
    console.err(e)
}

module.exports = {
    name: "yodaSpeak",
    defaultState: false,
    enable: function(client) {
        
    },
    disable: function(client) {

    },
    onChat: function(message) {
        fetchModule("yodaSpeak").then((mod) => {
            console.log(mod)
        }).catch((err) => {
            console.log(err)
        })
    }
}