import * as jwt from 'jsonwebtoken'
const debug = require("debug")("hackthethon:middleware");

export const middleware = {
    verify: async (req, res, next) => {
        var token = req.headers.authorization || ' ';
        token = token.split(" ")[1]

        if (!token) {
            return res
                .status(403)
                .send({ message: "A token is required for authentication" });
        }
        try {
            const decoded = jwt.verify(token, process.env.TOKEN_KEY) as jwt.JwtPayload;
            req.user = decoded;
        } catch (err) {
            debug(err)
            return res.status(401).send({ message: "Invalid Token" });
        }
        next();
    },
};
