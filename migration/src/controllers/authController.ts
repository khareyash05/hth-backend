const debug = require("debug")("hackthethon:AuthController");
import bcrypt from "bcryptjs/dist/bcrypt";
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { db } from "../config/db";
import { users } from "../models/schema";
import { eq } from "drizzle-orm";

export const authController = {
    register: async (req, res) => {
        try {
            const { first_name, last_name, email, password } = req.body;

            if (!(email && password && first_name && last_name)) {
                res.status(400).send({ message: "All input is required" });
            }

            const oldUser = await db.select().from(users).where(eq(users.email,email));

            if (oldUser!=null) {
                return res
                    .status(409)
                    .send({ message: "User Already Exist. Please Login" });
            }

            //Encrypt user password
            const encryptedPassword = await bcrypt.hash(password, 10);

            // Create user in our database
            await db.insert(users).values([
                {
                    first_name,
                    last_name,
                    email: email.toLowerCase(),
                    password: encryptedPassword,
                }
            ])

            const user = await db.select().from(users).where(eq(users.email,email.toLowerCase()))

            // Create token
            const token = jwt.sign(
                { user_id: user[0].id, email },
                process.env.TOKEN_KEY!,
                {
                    expiresIn: "1d",
                }
            );

            user[0].token = token;

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
            // const user = await User.findOne({ email }, "-__v");
            const user = await db.select().from(users).where(eq(users.email,email))

            const { password: pwd, ...data } = user[0]._doc;
            const validPassword = await bcrypt.compare(password, pwd);

            if (user && validPassword) {
                // Create token
                const token = jwt.sign(
                    { user_id: user[0].id, email },
                    process.env.TOKEN_KEY!,
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
            const user = await db.select().from(users).where(eq(users.email,email))

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const resetToken = jwt.sign({ email }, process.env.TOKEN_KEY!, {
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
                to: user[0].email,
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
                process.env.TOKEN_KEY!,
                async (err, decoded) => {
                    if (err) {
                        return res
                            .status(400)
                            .json({ error: "Invalid or expired reset token" });
                    }

                    // Find the user with the provided email (from the JWT payload)
                    const user = await db.select().from(users).where(eq(users.email,decoded.email))

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
                    await db.update(users).set({password:encryptedPassword}).where(eq(users.email,decoded.email))

                    res.json({ message: "Password reset successful" });
                }
            );
        } catch (err) {
            res.status(500).send({ message: "Something Went wrong" });
            debug(err);
        }
    },
};
