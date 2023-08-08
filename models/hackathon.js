const mongoose = require("mongoose");

const hackathonSchema = new mongoose.Schema({
    name: { type: String, default: null },
    description: { type: String, default: null },
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    application_deadline: { type: Date, default: null },
    application_open: { type: Date, default: null },
    venue: { type: String, default: null },
    min_team_size: { type: Number, default: null },
    max_team_size: { type: Number, default: null },
    theme: { type: String, default: null },
    imgUrl: { type: String, required: false },
    rules: [
        {
            title: { type: String, default: null },
            description: { type: String, default: null },
        },
    ],
    problem_statement: [
        {
            title: { type: String, default: null },
            description: { type: String, default: null },
            category: { type: String, default: null },
        },
    ],
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    partners: [
        {
            name: { type: String, default: null },
            logo: { type: String, default: null },
            website: { type: String, default: null },
        },
    ],
    prizes: [
        {
            name: { type: String, default: null },
            amount: { type: Number, default: null },
        },
    ],
    faqs: [
        {
            question: { type: String, default: null },
            answer: { type: String, default: null },
        },
    ],
    teams: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "team",
        },
    ],
    judges: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
    ],
    winners: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "team",
        },
    ],
    announcements: [
        {
            title: { type: String, default: null },
            description: { type: String, default: null },
            time: { type: Date, default: Date.now },
        },
    ],
});

module.exports = mongoose.model("hackathon", hackathonSchema);
