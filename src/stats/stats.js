module.exports = {
    fetchUserCount: function(client) {
        let count = 0;
        for (let k in client.guilds) {
            console.log("guild yes");
            let guild = client.guilds[k];
            count += guild.memberCount;
            console.log(count);
            console.log(guild.memberCount);
        }
        return count;
    }
};