import {Router} from "express";
import  {registerUser} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1 //number of files
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]), 
    registerUser) 

router.route("./login").post(loginUser)

router.route("./logout").post(verifyJWT, logoutUser)    //verifyJWT is a middleware,that why next() is used so that it can go to next middleware after completing one middlware

export default router;