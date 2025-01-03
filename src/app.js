import express from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser';
import { trusted } from 'mongoose';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//configurations for express
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))   //to serve static files(eg. images)
app.use(cookieParser())

//import routes
import userRouter from "./routes/user.routes.js"

//route declaration
app.use("/api/v1/user", userRouter)

export default app;