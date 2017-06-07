module.exports = {
    fetchUserCount: function(client) {
        let count = 0;
        for (let k in client.guilds) {
            let guild = client.guilds[k];
            count += guild.members.length;
        }
        return count;
    }
};