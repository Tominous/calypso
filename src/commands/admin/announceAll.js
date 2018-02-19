const guildUtil = require("../../util/guildUtil")

module.exports = {
    name: "announceAll",
    description: "Announces to all servers",
    params: ["text"],
    ownerOnly: true,
    handle: async function(message, params, client) {
        message.reply("Sending announcement...").then(reply => {
            params.shift()
            let text = params.join(" ")
            const guilds = client.guilds.array()

            let allPromises = []

            for (let i = 0; i < guilds.length; i++) {
                let guild = guilds[i]
                let channel = getDefaultChannel(guild)
                if (channel) {
                    allPromises.push(channel.sendMessage(":rocket: Announcement! " + text))
                }
            }

            await Promise.all(allPromises)
            reply.edit("Finished announcement. Sent to " + allPromises.length + " guilds.")
        })
    }
}