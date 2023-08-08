const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    first_name: { type: String, default: null },
    last_name: { type: String, default: null },
    email: { type: String, unique: true },
    password: { type: String },
    token: { type: String },
    hackathonsOrganized: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "hackathon",
        },
    ],
    hackathonsParticipated: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "hackathon",
        },
    ],
    hackathonsJudged: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "hackathon",
        },
    ],
    teams: [   
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "team",
        },
    ],
});

module.exports = mongoose.model("user", userSchema);