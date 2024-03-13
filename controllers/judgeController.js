const debug = require("debug")("hackthethon:JudgeController");
const team = require("../models/teams");
const jwt = require("jsonwebtoken");
const hackathon = require("../models/hackathon");

module.exports = {
    getSubmissions: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const id = req.params.id;
            const hackathonData = await hackathon
                .findOne({
                    _id: id,
                    judges: decoded.user_id,
                })
                .populate("teams");

            if (hackathonData == null) {
                return res.status(404).send({
                    message: "Hackathon not found or you are not a judge",
                });
            }
            if (hackathonData.teams != null) {
                hackathonData.submissions = hackathonData.teams.filter(
                    (team) =>
                        team.submission !== null &&
                        team.submission !== undefined &&
                        team.submission !== []
                );
                res.status(200).send(hackathonData.submissions);
            } else {
                res.status(404).send({ message: "No submissions found" });
            }
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    addReview: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const user_id = decoded.user_id;
            const id = req.params.id;
            const { team_id, review, score } = req.body;
            const hackathonData = await hackathon
                .findOne({
                    _id: id,
                    judges: user_id,
                });

            if (hackathonData == null) {
                return res.status(404).send({
                    message: "Hackathon not found or you are not a judge",
                });
            }

            const teamData = await team.findById(team_id);
            if (hackathonData.teams.includes(team_id)) {
                const reviewData = {
                    judge: user_id,
                    review: review,
                    score: score,
                };
                teamData.reviews.push(reviewData);
                await teamData.save();
                res.status(200).send({ message: "Review added" });
            } else {
                res.status(404).send({ message: "Team not found" });
            }
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },
};
