module.exports = {
    name: "yodaSpeak",
    defaultState: false,
    enable: function(client) {
        
    },
    disable: function(client) {

    },
    onChat: function(message) {
        console.log(message.content)
    }
}