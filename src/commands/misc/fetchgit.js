const exec = require('child_process').exec,
    logger = require('../../logger'),
    permissions = require('../../permissions/permissions'),
    shutdown = require('../../shutdown');

module.exports = {
    name: "fetch-git",
    description: "Pulls the latest source from git (Admin only).",
    parameters: [],
    ownerOnly: true,
    handle: function(message, params, client) {
        message.channel.send(":satellite_orbital: Fetching latest `git source`").then(gitMessage => {
            exec("git pull", (err, stdout, sterr) => {
                if (err !== null) {
                    gitMessage.edit(":x: Failed to download latest update!\n```" + sterr + "```");
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
}