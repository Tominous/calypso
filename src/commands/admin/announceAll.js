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
                let channel = guild.defaultChannel
                if (channel) {
                    let sendMessagePromise = channel.sendMessage(":rocket: Announcement! " + text)
                    allPromises.push(sendMessagePromise)
                }
            }

            //await Promise.all(allPromises)
            reply.edit("Finished announcement. Sent to " + allPromises.length + " guilds.")
        })
    }
}