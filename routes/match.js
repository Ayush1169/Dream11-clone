const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  title: String,
  teamA: String,
  teamB: String,
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    enum: ['upcoming', 'live', 'completed', 'expired'],
    default: 'upcoming'
  },
  players: [{
    name: String,
    team: String,
    role: String, // e.g., "batsman", "bowler"
    credits: Number,
    points: {
      type: Number,
      default: 0
    },
    runs: {
      type: Number,
      default: 0
    },
    ballsFaced: {
      type: Number,
      default: 0
    },
    wickets: {
      type: Number,
      default: 0
    },
    oversBowled: {
      type: Number,
      default: 0
    },
    runsGiven: {
      type: Number,
      default: 0
    }
  }],
  currentInning: {
    battingTeam: String,
    bowlingTeam: String,
    runs: {
      type: Number,
      default: 0
    },
    wickets: {
      type: Number,
      default: 0
    },
    sportmonksId: {
        type: Number,
        unique: true,
        sparse: true
    },
    overs: {
      type: Number,
      default: 0
    },
    currentBatsmen: [String], // player names or IDs
    currentBowler: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
