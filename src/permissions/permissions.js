module.exports = {
    addPermissionNode: function(client, guild, role, permission) {
        return new Promise(function(resolve, reject) {
            let mongo = client.mongo;
            let name = "roles." + role.name + ".permissions";
            let update = {};
            update[name] = permission;
            mongo.collection("guild_permissions").updateOne({
                "guildId": guild.id
            }, {
                $addToSet: update
            }, {
                upsert: true
            }, function(err, object) {
                if (err) {
                    reject(err);
                } else {
                    resolve(object);
                }
            });
        });
    },
    updateGuild: function(client, guild) {
        return new Promise(function(resolve, reject) {
            let mongo = client.mongo;
            let roles = {};
            for (let r in guild.roles.array()) {
                let role = guild.roles.array()[r];
                roles[role.name] = [];
            }
            console.log(roles);
            mongo.collection("guild_permissions").updateOne({
                "guildId": guild.id
            }, {
                roles: roles
            }, {
                upsert: true
            }, function(err, object) {
                console.log(err);
                console.log(object);

                if (err) {
                    reject(err);
                } else {
                    resolve(object);
                }
            });
        });
    }
};