const debug = require("debug")("hackthethon:AuthController");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const nodemailer = require("nodemailer");

module.exports = {
    register: async (req, res) => {
        try {
            const { first_name, last_name, email, password } = req.body;

            if (!(email && password && first_name && last_name)) {
                res.status(400).send({ message: "All input is required" });
            }

            const oldUser = await User.findOne({ email });

            if (oldUser) {
                return res
                    .status(409)
                    .send({ message: "User Already Exist. Please Login" });
            }

            //Encrypt user password
            encryptedPassword = await bcrypt.hash(password, 10);

            // Create user in our database
            const user = await User.create({
                first_name,
                last_name,
                email: email.toLowerCase(),
                password: encryptedPassword,
            });

            // Create token
            const token = jwt.sign(
                { user_id: user._id, email },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "1d",
                }
            );

            user.token = token;

            res.status(201).send({ message: "User created" });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!(email && password)) {
                res.status(400).send({ message: "All input is required" });
            }
            // Validate if user exist in our database
            const user = await User.findOne({ email }, "-__v");

            const { password: pwd, ...data } = user._doc;
            const validPassword = await bcrypt.compare(password, pwd);

            if (user && validPassword) {
                // Create token
                const token = jwt.sign(
                    { user_id: user._id, email },
                    process.env.TOKEN_KEY,
                    {
                        expiresIn: "1d",
                    }
                );

                data.token = token;

                res.status(200).json(data);
            } else {
                res.status(400).send({ message: "Invalid Credentials" });
            }
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const frontendURL = process.env.FRONTEND_URL;
            // Find the user with the provided email
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const resetToken = jwt.sign({ email }, process.env.TOKEN_KEY, {
                expiresIn: "1h",
            });

            // TODO()
            // Send the reset token to the user's email
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_ID,
                    pass: process.env.EMAIL_PASSWORD,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_ID,
                to: user.email,
                subject: "Password Reset",
                html: `
                    <p>You have requested a password reset for your account.</p>
                    <p>Click <a href="${frontendURL}/reset-password?resetToken=${resetToken}">here</a> to reset your password.</p>
                  `,
            };

            await transporter.sendMail(mailOptions);

            res.json({ message: "Password reset email sent successfully" });
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },

    resetPassword: async (req, res) => {
        try {
            // take token from headers
            const resetToken = req.headers['reset-token'];
            const { newPassword } = req.body;
            debug(resetToken);
            jwt.verify(
                resetToken,
                process.env.TOKEN_KEY,
                async (err, decoded) => {
                    if (err) {
                        return res
                            .status(400)
                            .json({ error: "Invalid or expired reset token" });
                    }

                    // Find the user with the provided email (from the JWT payload)
                    const user = await User.findOne({ email: decoded.email });

                    if (!user) {
                        return res
                            .status(404)
                            .json({ error: "User not found" });
                    }

                    // Encrypt the new password
                    const encryptedPassword = await bcrypt.hash(
                        newPassword,
                        10
                    );
                    user.password = encryptedPassword;
                    await user.save();

                    res.json({ message: "Password reset successful" });
                }
            );
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },
};
