const debug = require("debug")("hackthethon:TeamController");
const user = require("../models/user");
const hackathon = require("../models/hackathon");
const team = require("../models/teams");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

module.exports = {
    register: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const user_id = decoded.user_id;
            const { name, hackathon_id } = req.body;
            if (!name || !hackathon_id) {
                res.status(400).send({ message: "Name and hackathon ID required" });
            }

            const oldTeam = await team.findOne({
                name: name,
                hackathon: hackathon_id,
            });

            if (oldTeam) {
                return res.status(409).send({
                    message:
                        "Team with that name Already Exist, Please give other name",
                });
            }

            const newTeam = await team.create({
                name: name,
                members: [user_id],
                hackathon: hackathon_id,
            });
            try {
                await hackathon.findByIdAndUpdate(
                    hackathon_id,
                    {
                        $push: {
                            teams: newTeam._id,
                        },
                    },
                    { new: true }
                );
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }

            try {
                await user.findByIdAndUpdate(
                    user_id,
                    {
                        $push: {
                            teams: newTeam._id,
                            hackathonsParticipated: hackathon_id,
                        },
                    },
                    { new: true }
                );
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
            const teamData = await team.findById(team_id);
            if (!teamData) {
                return res.status(409).send({
                    message: "Team does not exist",
                });
            }
            if (!teamData.members.includes(user_id)) {
                return res.status(409).send({
                    message: "You are not team member",
                });
            }

            const { name, submissions } = req.body;
            if (name) {
                const oldTeam = await team.findOne({ name });

                if (oldTeam) {
                    return res.status(409).send({
                        message:
                            "Team with that name Already Exist, Please give other name",
                    });
                }
                await team.findByIdAndUpdate(
                    team_id,
                    {
                        name: name,
                    },
                    { new: true }
                );
            }
            if (submissions) {
                await team.findByIdAndUpdate(
                    team_id,
                    {
                        submissions: submissions,
                    },
                    { new: true }
                );
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
            const teamData = await team.findById(team_id);
            if (!teamData) {
                return res.status(409).send({
                    message: "Team with does not exist",
                });
            }
            await team.findByIdAndUpdate(
                team_id,
                {
                    $pull: {
                        members: user_id,
                    },
                },
                { new: true }
            );
            if (teamData.members.length === 0) {
                try {
                    await hackathon.findByIdAndUpdate(
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
                team.findByIdAndDelete(team_id);
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
            
            const teamData = await team.findById(team_id);
            const hackathonData = await hackathon.findById(hackathon_id);
            if (!teamData) {
                return res.status(409).send({
                    message: "Team does not exist",
                });
            }
            if (
                hackathonData.admin.toString() !== user_id &&
                !teamData.members.includes(user_id)
            ) {
                return res.status(409).send({
                    message: "You are not admin or part of this team",
                });
            }

            try {
                await hackathon.findByIdAndUpdate(
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
                await user.updateMany(
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
            team.findByIdAndDelete(team_id);
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
            const teamData = await team.findById(team_id);
            if (!teamData) {
                return res.status(409).send({
                    message: "Team does not exist",
                });
            }
            if (!teamData.members.includes(user_id)) {
                return res.status(409).send({
                    message: "You are not a team member",
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
                subject: "Invitation to join team",
                html: `<p>You have been invited to join team ${teamData.name} for a hackathon. Click <a href="${inviteURL}">here</a> to join the team.</p>`,
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
            const teamData = await team.findById(team_id);
            if (!teamData) {
                return res.status(409).send({
                    message: "Team with does not exist",
                });
            }
            try {
                await team.findByIdAndUpdate(
                    team_id,
                    {
                        $addToSet: {
                            members: user_id,
                        },
                    },
                    { new: true }
                );
            } catch (err) {
                res.status(500).send({ message: "Something Went wrong" });
                debug(err);
            }
            try {
                await user.findByIdAndUpdate(
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
            const hackathonData = await hackathon.findById(hackathon_id);
            if (!hackathonData) {
                return res.status(409).send({
                    message: "Hackathon does not exist",
                });
            }
            const teams = await team.find({ _id: { $in: hackathonData.teams } });
            res.send({ teams });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },
};
