const debug = require("debug")("hackthethon:UserController");
const hackathon = require("../models/hackathon");
const user = require("../models/user");
const jwt = require("jsonwebtoken");

module.exports = {
    getUser: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const id = decoded.user_id;
            const userData = await user
                .findById(id, "-password -__v")
                .populate({
                    path: "hackathonsOrganized",
                    select: "-judges -teams -winners -announcements -admin -prizes -partners -faqs -__v",
                })
                .populate({
                    path: "hackathonsParticipated",
                    select: "-judges -teams -winners -announcements -admin -prizes -partners -faqs -__v",
                })
                .populate({
                    path: "hackathonsJudged",
                    select: "-judges -teams -winners -announcements -admin -prizes -partners -faqs -__v",
                });
            res.status(200).send(userData);
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    editUser: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const id = decoded.user_id;
            const { first_name, last_name, email } = req.body;
            const userData = await user.findByIdAndUpdate(
                id,
                { first_name, last_name, email },
                { new: true }
            );
            res.status(200).send(userData);
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    getOrganisedHackathons: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const id = decoded.user_id;
            const userData = await user
                .findById(id, "-password -__v")
                .populate("hackathonsOrganized");
            res.status(200).send(userData);
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    getParticpatedHackathons: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const id = decoded.user_id;
            const userData = await user
                .findById(id, "-password -__v")
                .populate("hackathonsParticipated");
            res.status(200).send(userData);
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    getJudgedHackathons: async (req, res) => {
        try {
            const token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            const id = decoded.user_id;
            const userData = await user
                .findById(id, "-password -__v")
                .populate("hackathonsJudged");
            res.status(200).send(userData);
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const userData = await user
                .find({}, "-password -__v")
                .populate({
                    path: "hackathonsOrganized",
                    select: "-judges -teams -winners -announcements -admin -prizes -partners -faqs -__v",
                })
                .populate({
                    path: "hackathonsParticipated",
                    select: "-judges -teams -winners -announcements -admin -prizes -partners -faqs -__v",
                })
                .populate({
                    path: "hackathonsJudged",
                    select: "-judges -teams -winners -announcements -admin -prizes -partners -faqs -__v",
                })
                .populate({
                    path: "teams",
                    select: "-__v -members",
                });
            res.status(200).send(userData);
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },
};
