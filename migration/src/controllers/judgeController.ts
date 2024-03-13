const debug = require("debug")("hackthethon:JudgeController");
import * as jwt from 'jsonwebtoken'
import { and, eq } from "drizzle-orm";
import { db } from "../config/db";
import { hackathons,teams } from "../models/schema";

export const JudgeController = {
    getSubmissions: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const id = req.params.id;
            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id, id) ,eq(hackathons.judges,decoded.user_id)
            ))

            if (hackathonData == null) {
                return res.status(404).send({
                    message: "Hackathon not found or you are not a judge",
                });
            }
            if (hackathonData[0].teams != null) {
                hackathonData[0].submissions = hackathonData[0].teams.filter(
                    (team) =>
                        team.submission !== null &&
                        team.submission !== undefined
                );
                res.status(200).send(hackathonData[0].submissions);
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
            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id,id),
                eq(hackathons.judges,user_id)
            ))

            if (hackathonData == null) {
                return res.status(404).send({
                    message: "Hackathon not found or you are not a judge",
                });
            }

            const teamData = await teams.findById(team_id);
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
