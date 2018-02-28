const Discord = require('discord.js')

module.exports = {
  getDefaultChannel: async (guild) => {
    if (guild.channels.exists('name', 'general')) {
      return guild.channels.find('name', 'general');
    }
  
    return guild.channels.filter(c => c.type === 'text' && c.permissionsFor(guild.client.user).has('SEND_MESSAGES'))
      .sort((a, b) => a.position - b.position || Long.fromString(a.id).sub(Long.fromString(b.id)).toNumber())
      .first();
  }
}
  