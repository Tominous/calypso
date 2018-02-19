module.exports = {
    name: "yodaSpeak",
    defaultState: false,
    enable: function(client) {
        
    },
    disable: function(client) {

    },
    onChat: function(message, client) {
        client.guilds.find("310104725078933525").then(guild => {
            console.log(guild)
        })
    }
}