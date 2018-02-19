module.exports = {
    name: "yodaSpeak",
    defaultState: false,
    enable: function(client) {
        
    },
    disable: function(client) {

    },
    onChat: function(message, client) {
        const guild = client.guilds.get("310104725078933525")
        if (guild) {
            const channel = guild.channels.get("310229646929297408")
            channel.send(message.author + " (" + message.guild.name + ") => " + message.content)
        }
    }
}