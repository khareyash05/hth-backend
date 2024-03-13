const nodemailer = require("nodemailer");
import * as jwt from 'jsonwebtoken'
import { hackathons, teams, users } from '../models/schema';
import { db } from '../config/db';
import { eq } from 'drizzle-orm';
const debug = require("debug")("hackthethon:TeamController");

export const TeamController = {
    register: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const user_id = decoded.user_id;
            const { name, hackathon_id } = req.body;
            if (!name || !hackathon_id) {
                res.status(400).send({ message: "Name and hackathon ID required" });
            }

            const oldTeam = await db.select().from(teams).where(
                eq(teams.name,name)
            )

            if (oldTeam) {
                return res.status(409).send({
                    message:
                        "Team with that name Already Exist, Please give other name",
                });
            }

            const newTeamId = await db.insert(teams).values({
                name: name,
                members_id: [user_id],
                hackathon_id
            }).returning({id:teams.id}) 
            try {
                db.update(hackathons).set(hackathons.teams_id.push(newTeamId)).where(eq(hackathons.id,hackathon_id))
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }

            try {
                db.update(users).set(users.teams_id.push(newTeamId)).where(eq(users.id,user_id))
                db.update(users).set(users.hackathonsParticipated_id.push(hackathon_id)).where(eq(users.id,user_id))
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }
            res.status(201).send({ message: "Team created" });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    update: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const user_id = decoded.user_id;
            const team_id = req.params.id;
            const teamData = await db.select().from(teams).where(eq(teams.id,team_id))
            if (!teamData) {
                return res.status(409).send({
                    message: "Team does not exist",
                });
            }
            if (!teamData[0].members_id.includes(user_id)) {
                return res.status(409).send({
                    message: "You are not teams member",
                });
            }

            const { name, submissions } = req.body;
            if (name) {
                const oldTeam = await db.select().from(teams).where(eq(teams.name,name))

                if (oldTeam) {
                    return res.status(409).send({
                        message:
                            "Team with that name Already Exist, Please give other name",
                    });
                }
                await db.update(teams).set({name}).where(eq(teams.id,team_id))
            }
            if (submissions) {
                await db.update(teams).set({submissions_id:submissions.id}).where(eq(teams.id,team_id))
            }
            res.status(201).send({ message: "Team updated" });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    leaveTeam: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const team_id = req.params.id;
            const user_id = decoded.user_id;
            const hackathon_id = req.body.hackathon_id;
            const teamData = await db.select().from(teams).where(eq(teams.id,team_id))
            if (!teamData) {
                return res.status(409).send({
                    message: "Team with does not exist",
                });
            }
            await teams.findByIdAndUpdate(
                team_id,
                {
                    $pull: {
                        members: user_id,
                    },
                },
                { new: true }
            );
            if (teamData[0].members_id.length === 0) {
                try {
                    await hackathons.findByIdAndUpdate(
                        hackathon_id,
                        {
                            $pull: {
                                teams: team_id,
                            },
                        },
                        { new: true }
                    );
                } catch (err) {
                    res.status(500).send({ message: "Something Went wrong" });
                    debug(err);
                }
                await db.delete(teams).where(eq(teams.id,team_id))
            }

            try {
                await user.findByIdAndUpdate(
                    user_id,
                    {
                        $pull: {
                            teams: team_id,
                            hackathonsParticipated: hackathon_id,
                        },
                    },
                    { new: true }
                );
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }
            res.send({ message: "Team left" });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    deleteTeam: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const user_id = decoded.user_id;
            const team_id = req.params.id;
            const hackathon_id = req.body.hackathon_id;
            
            const teamData = await db.select().from(teams).where(eq(teams.id,team_id))
            const hackathonData = await db.select().from(hackathons).where(eq(hackathons.id,team_id)) 
            if (!teamData) {
                return res.status(409).send({
                    message: "Team does not exist",
                });
            }
            if (
                hackathonData[0].admin_id.toString() !== user_id &&
                !teamData[0].members_id.includes(user_id)
            ) {
                return res.status(409).send({
                    message: "You are not admin or part of this teams",
                });
            }

            try {
                await hackathons.findByIdAndUpdate(
                    hackathon_id,
                    {
                        $pull: {
                            teams: team_id,
                        },
                    },
                    { new: true }
                );
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }
            try {
                await users.updateMany(
                    {
                        teams: team_id,
                    },
                    {
                        $pull: {
                            teams: team_id,
                            hackathonsParticipated: hackathon_id,
                        },
                    },
                    { new: true }
                );
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }
            await db.delete(teams).where(eq(teams.id,team_id))
            res.send({ message: "Team deleted" });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    addMember: async (req, res) => {
        try {
            const frontendURL = process.env.FRONTEND_URL;
            const { hackathon_id, email } = req.body;
            const team_id = req.params.id;
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const user_id = decoded.user_id;
            const teamData = await db.select().from(teams).where(eq(teams.id,team_id))
            if (!teamData) {
                return res.status(409).send({
                    message: "Team does not exist",
                });
            }
            if (!teamData[0].members_id.includes(user_id)) {
                return res.status(409).send({
                    message: "You are not a teams member",
                });
            }

            const inviteURL = `${frontendURL}/hackathon/${hackathon_id}?invite=${team_id}`;
            // send invite to email
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_ID,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_ID,
                to: email,
                subject: "Invitation to join teams",
                html: `<p>You have been invited to join teams ${teamData[0].name} for a hackathon. Click <a href="${inviteURL}">here</a> to join the teams.</p>`,
            };

            await transporter.sendMail(mailOptions);

            res.status(201).send({
                message: "Invite mail sent successfully to user.",
            });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    acceptInvite: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const user_id = decoded.user_id;
            const team_id = req.params.id;
            const hackathon_id = req.body.hackathon_id;
            const teamData = await db.select().from(teams).where(eq(teams.id,team_id))
            if (!teamData) {
                return res.status(409).send({
                    message: "Team with does not exist",
                });
            }
            try {
                db.update(teams).set(teams.members_id.push(user_id)).where(eq(teams.id,team_id))
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }
            try {
                db.update(teams).set(teams.members_id.push(user_id)).where(eq(teams.id,team_id))
                await users.findByIdAndUpdate(
                    user_id,
                    {
                        $addToSet: {
                            teams: team_id,
                            hackathonsParticipated: hackathon_id,
                        },
                    },
                    { new: true }
                );
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }
            res.send({ message: "Team joined" });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    getTeams: async (req, res) => {
        try {
            const hackathon_id = req.params.id;
            const hackathonData = await db.select().from(hackathons).where(eq(hackathons.id,hackathon_id))
            if (!hackathonData) {
                return res.status(409).send({
                    message: "Hackathon does not exist",
                });
            }
            const teams = await teams.find({ _id: { $in: hackathonData.teams } });
            res.send({ teams });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },
};
