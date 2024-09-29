const mongoose = require('mongoose')

const dd = new mongoose.Schema({
    channelId: String,
    guildId: String,
    country: String
})

module.exports = new mongoose.model("adahn", dd)