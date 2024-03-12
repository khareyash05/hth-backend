const debug = require("debug")("hackthethon:HackathonController");
import * as jwt from 'jsonwebtoken'
import { users,teams,hackathons } from "../models/schema";
import { db } from '../config/db';
import { and, eq , or } from 'drizzle-orm';

export const HackathonController = {
    create: async (req, res) => {
        try {
            const token:string = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const admin = decoded.user_id;
            const {
                name,
                start_date,
                end_date,
                imgUrl,
                description,
                application_deadline,
                application_open,
                max_team_size,
                min_team_size,
                venue,
                theme,
            } = req.body;

            const oldHackathon = await db.select().from(hackathons).where(eq(hackathons.name,name))

            if (oldHackathon) {
                return res.status(409).send({
                    message:
                        "Hackathon with that name Already Exist, Please give other name",
                });
            }

            const newHackathon = await db.insert(hackathons).values({
                name: name,
                start_date: start_date,
                end_date: end_date,
                imgUrl: imgUrl,
                admin: admin,
                description: description,
                application_deadline: application_deadline,
                application_open: application_open,
                max_team_size: max_team_size,
                min_team_size: min_team_size,
                venue: venue,
                theme: theme,
            });
            try {
                await db.update(users).set({hackathonsOrganized:newHackathon.id}).where(eq(users.id,admin))
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err); 
            }
            res.status(201).send({ message: "Hackathon created" });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    update: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const id = req.params.id;
            const admin = decoded.user_id;
            const hackathonData = await db.select().from(hackathons).where(and(eq(hackathons.admin,admin),eq(hackathons.id,id)))

            if (!hackathonData) {
                return res.status(404).send({
                    message: "Hackathon not found or you're not the admin.",
                });
            }

            // Get the keys from the request body
            const updates = Object.keys(req.body);

            // Update the hackathons document based on the keys and values from the request body
            updates.forEach((update) => {
                hackathonData[update] = req.body[update];
            });

            await hackathonData.save();
            res.status(200).send({
                message: "Hackathon updated successfully.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    delete: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const hackathonId = req.params.id;
            const admin = decoded.user_id;
            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id,hackathonId),
                eq(hackathons.admin,admin)
            ))
            if (!hackathonData) {
                return res.status(404).send({
                    message: "Hackathon not found or you're not the admin.",
                });
            }

            // Find all users who have organized, participated, or judged this hackathons
            const usersToUpdate = await db.select().from(users).where(or(
                eq(users.hackathonsOrganized,hackathonId),
                eq(users.hackathonsJudged,hackathonId),
                eq(users.hackathonsParticipated,hackathonId)
            ))

            // Update the references in users
            await Promise.all(
                usersToUpdate.map((user) => {
                    user.hackathonsOrganized = user.hackathonsOrganized.filter(
                        (_id) => _id.toString() !== hackathonId
                    );
                    user.hackathonsParticipated =
                        user.hackathonsParticipated.filter(
                            (_id) => _id.toString() !== hackathonId
                        );
                    user.hackathonsJudged = user.hackathonsJudged.filter(
                        (_id) => _id.toString() !== hackathonId
                    );
                    return user.save();
                })
            );

            // Find all teams associated with this hackathons
            const teamsToUpdate = await db.select().from(teams).where(eq(hackathonId,hackathonId))

            // Update the references in teams and delete the teams
            await Promise.all(
                teamsToUpdate.map((team) => {
                    team.members = team.members.filter(
                        (_id) => _id.toString() !== hackathonId
                    );
                    return team.delete();
                })
            );

            await db.delete(hackathons).where(eq(hackathonId,hackathonId));

            res.status(200).send({
                message: "Hackathon deleted successfully.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    get: async (req, res) => {
        try {
            const id = req.params.id;
            // const hackathonData1 = await db.select().from(hackathons).where(eq(hackathons.id,id))
            const hackathonData = await hackathons
                .findById(id)
                .populate({
                    path: "judges",
                    select: "first_name last_name email _id",
                })
                .populate({
                    path: "winners",
                    populate: {
                        path: "members",
                        select: "first_name last_name email _id",
                    },
                    select: "name members _id",
                })
                .populate({
                    path: "admin",
                    select: "first_name last_name email _id",
                })
                .populate({
                    path: "teams",
                    populate: {
                        path: "members",
                        select: "first_name last_name email _id",
                    },
                    select: "name members _id submissions",
                });
            res.status(200).send(hackathonData);
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    getRestricted: async (req, res) => {
        try {
            const id = req.params.id;
            const hackathonData = await hackathons
                .findById(id)
                .populate({
                    path: "judges",
                    select: "first_name last_name email _id",
                })
                .populate({
                    path: "winners",
                    populate: {
                        path: "members",
                        select: "first_name last_name email _id",
                    },
                    select: "name members _id",
                })
                .populate({
                    path: "admin",
                    select: "first_name last_name email _id",
                })
                .populate({
                    path: "teams",
                    populate: {
                        path: "members",
                        select: "first_name last_name email _id",
                    },
                    select: "-__v",
                });
            res.status(200).send(hackathonData);
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    getAll: async (req, res) => {
        try {
            const hackathons = await db.select().from(hackathons)
                .find()
                .select(
                    "-rules -problem_statement -judges -teams -winners -announcements -admin -partners -faqs -__v"
                );
            res.status(200).send(hackathons);
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    addAnnouncment: async (req, res) => {
        try {
            const id = req.params.id;
            const { title, description } = req.body;
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const user_id = decoded.user_id;

            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id,id),
                eq(hackathons.admin,user_id)
            ))

            if (!hackathonData) {
                return res.status(404).send({
                    message: "Hackathon not found or you're not the admin.",
                });
            }

            hackathonData.annoucements.push({
                title: title,
                description: description,
            });
            await hackathonData.save();
            res.status(200).send({
                message: "Annoucement added successfully.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    editAnnouncement: async (req, res) => {
        try {
            const id = req.params.id;
            const annoucementId = req.body.annoucementId;
            const { title, description, time } = req.body;
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const user_id = decoded.user_id;

            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id,id),
                eq(hackathons.admin,user_id)
            ))

            if (!hackathonData) {
                return res.status(404).send({
                    message: "Hackathon not found or you're not the admin.",
                });
            }

            const annoucement = hackathonData.annoucements.id(annoucementId);
            annoucement.title = title;
            annoucement.description = description;
            annoucement.time = time;
            await hackathonData.save();
            res.status(200).send({
                message: "Annoucement added successfully.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    deleteAnnouncment: async (req, res) => {
        try {
            const id = req.params.id;
            const annoucementId = req.body.annoucementId;
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const user_id = decoded.user_id;

            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id,id),
                eq(hackathons.admin,user_id)
            ))

            if (!hackathonData) {
                return res.status(404).send({
                    message: "Hackathon not found or you're not the admin.",
                });
            }

            const annoucement = hackathonData.annoucements.id(annoucementId);
            annoucement.remove();
            await hackathonData.save();
            res.status(200).send({
                message: "Annoucement deleted successfully.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    addWinner: async (req, res) => {
        try {
            const id = req.params.id;
            const { teamId } = req.body;
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const user_id = decoded.user_id;

            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id,id),
                eq(hackathons.admin,user_id)
            ))

            if (!hackathonData) {
                return res.status(404).send({
                    message: "Hackathon not found or you're not the admin.",
                });
            }

            hackathonData.winners.push(teamId);
            await hackathonData.save();
            res.status(200).send({
                message: "Winner added successfully.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    deleteWinner: async (req, res) => {
        try {
            const id = req.params.id;
            const { teamId } = req.body;
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const user_id = decoded.user_id;

            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id,id),
                eq(hackathons.admin,user_id)
            ))

            if (!hackathonData) {
                return res.status(404).send({
                    message: "Hackathon not found or you're not the admin.",
                });
            }

            const winner = hackathonData.winners.id(teamId);
            winner.remove();
            await hackathonData.save();
            res.status(200).send({
                message: "Winner deleted successfully.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    addJudge: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const user_id = decoded.user_id;
            const id = req.params.id;
            const { email } = req.body;
            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id,id),
                eq(hackathons.admin,user_id)
            ))

            if (!hackathonData) {
                return res.status(404).send({
                    message: "Hackathon not found or you're not the admin.",
                });
            }

            const judge = await db.select().from(users).where(eq(users.email,email));
            if (!judge) {
                return res.status(404).send({
                    message: "Judge not found.",
                });
            }

            try {
                await hackathons.findOneAndUpdate(
                    { _id: id },
                    {
                        $push: {
                            judges: judge._id,
                        },
                    }
                );
            } catch (err) {
                debug(err);
                return res.status(500).send({ message: "Something Went wrong" });
            }

            try {
                await judge.updateOne({
                    $push: {
                        hackathonsJudged: id,
                    },
                });
            } catch (err) {
                debug(err);
                return res.status(500).send({ message: "Something Went wrong" });
            }

            res.status(200).send({
                message: "Judge added successfully.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    deleteJudge: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY);
            const user_id = decoded.user_id;
            const id = req.params.id;
            const { judgeId } = req.body;
            const hackathonData = await db.select().from(hackathons).where(and(
                eq(hackathons.id,id),
                eq(hackathons.admin,user_id)
            ))

            if (!hackathonData) {
                return res.status(404).send({
                    message: "Hackathon not found or you're not the admin.",
                });
            }

            const judge = hackathonData.judges.id(judgeId);
            judge.remove();
            await hackathonData.save();

            try {
                await user.findByIdAndUpdate(judgeId, {
                    $pull: {
                        hackathonsJudged: id,
                    },
                });
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }
            res.status(200).send({
                message: "Judge deleted successfully.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },
};
