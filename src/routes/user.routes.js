import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { registerUser, subscribeToUser } from "../controllers/user.controller.js";
import {
  loginUser,
  logoutUser,
  homepage,
  getDashboard,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getSearchedUser,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  // subscribeToUser
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//router created successfully for getting to the webpage

router.route("/register").get( (req,res) =>{
  res.render('register', { title: 'Register Page' });
})
router.route("/login").get( (req,res) =>{
  res.render('login', { title: 'Login Page' , message: "Invalid username or password" });
})
router.route("/changePassword").get( (req,res) =>{
  res.render('changePassword', { title: 'Change Password' , message: "Invalid username or password" });
})
router.route("/updateAccount").get( (req,res) =>{
  res.render('updateAcD');
})

// router.route("/subscribe").get( (req,res) =>{
//   res.render('subscribePage');
// })

// The upload.fields([...]) part is likely using middleware (such as multer) to handle file uploads. 
// It specifies that two fields are expected in the incoming request:
// avatar: This field can accept one file (maxCount: 1).
// coverImage: This field can also accept one file (maxCount: 1).
// The upload.fields() middleware processes the incoming multipart/form-data request 
// and makes the uploaded files available in req.files.

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1, //number of files
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser    //calling controller
);


router.route("/login").post(loginUser);

//After login ,go to HOME PAGE
router.route("/home").get(verifyJWT,homepage);

router.route("/dashBoard").get(verifyJWT,getDashboard);

// router.route("/dashBoard").post(getDashboard);

router.route("/logout").post(verifyJWT, logoutUser); //verifyJWT is a middleware,that why next() is used so that it can go to next middleware after completing one middleware
router.route("/refreshToken").post(refreshAccessToken);

router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/currentUser").get(verifyJWT, getCurrentUser);

router.route("/updateAccount").patch(verifyJWT, updateAccountDetails);

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);


//getting other users info
// router.route("/dashBoard/getUserProfile").post(getSearchedUser);
router.route("/subscribeto").post(verifyJWT,subscribeToUser);
router.route("/subscribe").post(verifyJWT,getSearchedUser);

export default router;
