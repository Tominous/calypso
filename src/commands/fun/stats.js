module.exports = {
    name: "stats",
    description: "Shows the statistics for Calypso.",
    parameters: [],
    handle: async function (message, params, client) {
        let guilds = await client.shard.broadcastEval('this.guilds.size');
        guilds = guilds.reduce((prev, val) => prev + val, 0);
        let channels = await client.shard.broadcastEval('this.channels.size');
        channels = channels.reduce((prev, val) => prev + val, 0);
        let users = await client.shard.broadcastEval('this.users.size');
        users = users.reduce((prev, val) => prev + val, 0);
        let mem = await client.shard.broadcastEval('process.memoryUsage().heapUsed');
        mem = mem.reduce((prev, next) => prev + next / 1024 / 1024, 0).toFixed(2);

        let embed = new Discord.RichEmbed();
        embed.setTitle(":pencil: Statistics").setColor("#259c28");
        embed.addField("> Uptime", "• Client: " + (process.uptime() + "").toHHMMSS() + "\n• Host: " + (require('os').uptime() + "").toHHMMSS(), true);
        embed.addField("> General Stats", "• Guild Count: " + guilds + "\n• Users: " + users, true);
        embed.addField("> Other Data", "• Node Version: " + (process.version) + "\n• Discord.JS: v" + require('discord.js').version + "\n• Calypso: v1.7", true);
        embed.addField("> Usage", "• Ram Usage: " + mem + "MB", true);
        embed.setTimestamp();
        message.channel.sendEmbed(embed);
    }
}