const mongoose = require("mongoose")

const teamSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "USer",
    },
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",
    },
    players: [{
        name: String,
        playerId: String
    }],
    captain: String,
    viceCaptain: String,
}, {timestamps: true})

module.exports = mongoose.model("Team", teamSchema)
// This schema defines a Team model with fields for user, match, players, captain, and