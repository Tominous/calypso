const calypso = require("../calypso")
console.log(typeof calypso.fetchModule)

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