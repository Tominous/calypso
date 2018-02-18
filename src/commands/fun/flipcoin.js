module.exports = {
    name: "flipcoin",
    description: "Flips a coin",
    handle: function(message, params, client) {
        message.reply("Flipping coin...").then(flip => {
            let bool = Math.random() >= 0.5;
            setTimeout(function() {
                if (bool) {
                    flip.edit("The coin landed on heads!");
                } else {
                    flip.edit("The coin landed on tails!");
                }
            }, 1500);
        });
    }
}