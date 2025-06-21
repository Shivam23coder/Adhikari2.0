import express from "express";
import cors from 'cors'
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
// import path from 'path'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//configurations for express
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser())

// app.use(express.static('public'));//for css files

app.set('view engine','ejs')
app.set('views', path.join(__dirname, '../views'));

//going to index page
app.get('/api/v1/',async (req, res) => {
    res.render('index',{
        title: 'Welcome'            //this is the data which i want to pass
    })
});

//import routes
import userRouter from "./routes/user.routes.js"
// import blogRouter from "./routes/blog.routes.js"
//route declaration
app.use("/api/v1/user", userRouter)
// app.use("/api/v1/user/blog", blogRouter)

export default app;