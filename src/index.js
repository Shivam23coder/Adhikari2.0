// this file is created as the entry point of the application. 
// It connects to the database and starts the server. It also loads the environment variables from the .env file using the dotenv package.
//  The connectDB function is imported from the db/index.js file, which connects to the MongoDB database using the mongoose package.
//  The app is imported from the app.js file, which contains the Express application configuration. The app is then started on the specified port using the listen method. 
// If the connection to the database is successful, the server is started, and a message is logged to the console. 
// If the connection to the database fails, an error message is logged to the console.

import dotenv from "dotenv"
import connectDB from "./db/index.js"
import app from "./app.js"

dotenv.config({
    path: './.env'
});

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000,() =>{
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!!",err,"    error port : ", err.PORT);
});