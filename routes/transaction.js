const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
    },
    amount: Number,
    description: String,
    date: {
        type: Date,
        default: Date.now,
    },
})

module.exports = mongoose.model('Transaction', transactionSchema);