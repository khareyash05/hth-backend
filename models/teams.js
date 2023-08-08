const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
    name: { type: String, default: null },
    members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
    ],
    hackathon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "hackathon",
    },
    submissions: {
        title: { type: String, default: null },
        description: { type: String, default: null },
        links: [
            {
                type: String,
                default: null,
            },
        ],
    },
    reviews: [
        {
            judge: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "user",
            },
            review: { type: String, default: null },
            score: { type: Number, default: null },
        },
    ],
});

module.exports = mongoose.model("team", teamSchema);
