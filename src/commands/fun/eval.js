module.exports = {
    name: "eval",
    description: "Evaluate JavaScript and run it",
    parameters: ["script"],
    handle: function(message, params, client) {
        permissions.isGlobalOwner(message.author).then(res => {
            if (!res) {
                message.reply(":shield: No permissions. Only bot owners can execute this command.");
                logger.logPermissionFailed(message, message.author, client.mongo);
            } else {
                params.shift()
                let script = params.join(" ")
                console.log(script)
                message.reply(":satellite_orbital: Evaluating `" + script + "`").then((reply) => {
                    try {
                        let ran = eval(script)
                        if (ran) {
                            reply.edit(":white_check_mark: Finished evaluating. Response: `" + ran + "`")
                        } else {
                            reply.edit(":white_check_mark: Done evaluating. No data was returned.")
                        }
                    } catch (e) {
                        reply.edit("Failed to evaluate. `" + e.message + "`")
                        console.error(e)
                    }
                })
            }
        })
    }
}