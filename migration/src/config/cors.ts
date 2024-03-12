const debug = require('debug')('hackthethon:cors')
import cors from 'cors'

export function initCors (app) {
    app.use(
        cors({
            credentials: true,
            origin: "*",
        })
    );
    debug("CORS initialized");
};
