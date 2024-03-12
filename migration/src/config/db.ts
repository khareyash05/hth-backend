import * as dotenv from 'dotenv'
dotenv.config();

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL

const client = postgres(connectionString)
export const db = drizzle(client);


// module.exports = initDatabase = () => {
//     debug("Initializing database connection...");
//     let dbUri = process.env.MONGO_URI;
//     let options = {
//         autoIndex: false,
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     };

//     /**
//      * Start MongoDB Connection
//      */
//     mongoose
//         .connect(dbUri, options)
//         .catch((error) => debug(`Connection error: ${error}`));

//     /**
//      * Listeners on MongoDB Startup
//      */
//     const connection = mongoose.connection;
//     connection.on("connected", () => {
//         debug("Connected to database");
//     });
//     connection.on("error", (err) => {
//         debug(`Database error: ${err}`);
//     });
//     connection.on("disconnected", () => {
//         debug("Disconnected from database");
//     });
//     connection.on("reconnected", () => {
//         debug("Reconnected to database");
//     });
// };

