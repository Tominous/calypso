const exec = require('child_process').exec,
    logger = require('../logger'),
    permissions = require('../permissions/permissions');

module.exports = {
    name: "fetch-git",
    description: "Pulls the latest source from git (Admin only).",
    parameters: [],
    handle: function(message, params, client) {
        permissions.isGlobalOwner(message.author).then(res => {
            if (!res) {
                message.reply(":shield: No permissions. Only bot owners can execute this command.");
                logger.logPermissionFailed(message, message.author, client.mongo);
            } else {
                message.channel.send(":satellite_orbital: Fetching latest `git source`").then(gitMessage => {
                    exec("git pull", (err, stdout, sterr) => {
                        if (err !== null) {
                            gitMessage.edit(":x: Failed to download latest update!");
                            console.log(err);
                        } else {
                            if (stdout.toString().indexOf("Already up-to-date.") > -1) {
                                gitMessage.edit(":gem: Already up to date with git source!");
                            } else {
                                let realMsg = ":ok_hand: Finished all updates, restarting bot.\n```bash\n" + stdout + "\n"
                                gitMessage.edit(":white_check_mark: Downloaded latest version! Updating npm packages...").then(() => {
                                    exec("npm update", (err, out, ster) => {
                                        realMsg = realMsg + out + "\n```"
                                        gitMessage.edit(realMsg).then(() => {
                                            shutdown.shutdown(client)
                                            setTimeout(function () {
                                                process.exit(1)
                                            }, 2000)
                                        })
                                    })
                                })
                            }
                        }
                    });
                });
            }
        }).catch(function () {
            message.reply(":x: Permission check failed, try again later.");
        });
    }
}