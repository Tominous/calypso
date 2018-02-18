module.exports = {
    name: "eval",
    description: "Evaluate JavaScript and run it",
    parameters: ["script"],
    handle: function(message, params, client) {
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
}