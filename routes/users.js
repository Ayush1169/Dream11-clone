const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  wallet: {
    type: String,
    default: 0,
  },
  joinedContests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contest'
  }]
}, {timestamps: true});

// 🟢 Add plugin to handle hashing and auth methods
userSchema.plugin(passportLocalMongoose)

module.exports = mongoose.model("User", userSchema);
