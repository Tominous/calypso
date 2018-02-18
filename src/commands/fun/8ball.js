let responses = ["Yes", "No", "My sources point to...yes", "My sources point to...no", "You f****** know it!", "No! What is wrong with you?"];

module.exports = {
    name: "8ball",
    description: "It's a magic ball, what do you expect it to do?",
    parameters: ["question"],
    handle: function(message, params, client) {
        let response = responses[Math.floor(Math.random() * responses.length)];
        message.reply(":8ball: " + response);
    }
}