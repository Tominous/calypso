const Discord = require('discord.js')

const getDefaultChannel = async (guild) => {
    if (guild.channel.has(guild.id))
      return guild.channels.get(guild.id)

    if (guild.channels.exists("name", "general"))
      return guild.channels.find("name", "general");

    return guild.channels.filter(c => c.type === "text" && c.permissionsFor(guild.client.user).has("SEND_MESSAGES"))
     .sort((a, b) => a.position - b.position || Long.fromString(a.id).sub(Long.fromString(b.id)).toNumber())
     .first();
}
  