const Brain = require('node-brain'),
    brain = new Brain();

module.exports = {
    getBrain: function() {
        return new Promise(function(resolve, reject) {
            resolve(brain);
        });
    },
    trainBrain: function(message) {
        brain.addSentence(message);
        console.log("Training brain...");
    },
    getAnswer: function(sentence) {
        return new Promise(function(resolve, reject) {
            brain.getSentence(sentence).then(response => {
                resolve(response);
            }).catch(error => reject(error));
        });
    }
};