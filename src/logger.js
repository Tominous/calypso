module.exports = {
    logPermissionFailed: function (message, author, mongo) {
        mongo.collection("permission_failed").insertOne({
            "author": author,
            "command": message.content,
            "guild": message.guild,
            "failed_time": new Date().getTime()
        });
    }
};