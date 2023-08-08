const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const HackathonController = require("../controllers/hackathonController");
const TeamController = require("../controllers/teamController");
const UserController = require("../controllers/userController");
const JudgeController = require("../controllers/judgeController");
const middleware = require("../middleware/verify");

// Auth
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

// Hackathon - General
router.get("/hackathons", HackathonController.getAll);
router.get("/hackathon/:id", HackathonController.get);
router.post("/hackathon", middleware.verify, HackathonController.create);
router.put("/hackathon/:id", middleware.verify, HackathonController.update);
router.delete("/hackathon/:id", middleware.verify, HackathonController.delete);
router.get(
    "/hackathon/secret/:id",
    middleware.verify,
    HackathonController.getRestricted
);

// Hackathon - Announcement
router.post(
    "/hackathon/:id/announcement",
    middleware.verify,
    HackathonController.addAnnouncment
);
router.put(
    "/hackathon/:id/announcement",
    middleware.verify,
    HackathonController.editAnnouncement
);
router.delete(
    "/hackathon/:id/announcement",
    middleware.verify,
    HackathonController.deleteAnnouncment
);

// Hackathon - Judge
router.post(
    "/hackathon/:id/judge",
    middleware.verify,
    HackathonController.addJudge
);
router.delete(
    "/hackathon/:id/judge/:judge_id",
    middleware.verify,
    HackathonController.deleteJudge
);

// Hackathon - Winner
router.post(
    "/hackathon/:id/winner",
    middleware.verify,
    HackathonController.addWinner
);
router.delete(
    "/hackathon/:id/winner/:winner_id",
    middleware.verify,
    HackathonController.deleteWinner
);

// Team
router.post("/hackathon/team", middleware.verify, TeamController.register);
router.put("/hackathon/team/:id", middleware.verify, TeamController.update);
router.get("/hackathon/team/:id", middleware.verify, TeamController.getTeams);
router.post(
    "/hackathon/team/:id/invite",
    middleware.verify,
    TeamController.addMember
);
router.put(
    "/hackathon/team/:id/leave",
    middleware.verify,
    TeamController.leaveTeam
);
router.post(
    "/hackathon/team/:id/join",
    middleware.verify,
    TeamController.acceptInvite
);
router.delete(
    "/hackathon/team/:id",
    middleware.verify,
    TeamController.deleteTeam
);

// User
router.get("/user", middleware.verify, UserController.getUser);
router.get("/user/all", middleware.verify, UserController.getAllUsers);
router.put("/user", middleware.verify, UserController.editUser);
router.get(
    "/user/hackathons/organized",
    middleware.verify,
    UserController.getOrganisedHackathons
);
router.get(
    "/user/hackathons/participated",
    middleware.verify,
    UserController.getParticpatedHackathons
);
router.get(
    "/user/hackathons/judged",
    middleware.verify,
    UserController.getJudgedHackathons
);

// Judge
router.get(
    "/hackathon/:id/submissions",
    middleware.verify,
    JudgeController.getSubmissions
);
router.post(
    "/hackathon/:id/review",
    middleware.verify,
    JudgeController.addReview
);

module.exports = router;
