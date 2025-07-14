const mongoose = require('mongoose');
const team = require('./team');

const contestSchema = new mongoose.Schema({
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match"
    },
    entryFee: Number,
    prizePool: Number,
    maxUsers: Number,
    joinedUsers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team"
        }
    }],
    isLocked: {
        type: Boolean,
        default: false
    },
}, {timestamps: true});

module.exports = mongoose.model("Contest", contestSchema);