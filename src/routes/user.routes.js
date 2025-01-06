import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser } from "../controllers/user.controller.js";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

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
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser); //verifyJWT is a middleware,that why next() is used so that it can go to next middleware after completing one middlware
router.route("/refreshToken").post(refreshAccessToken);

router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/currentUser").get(verifyJWT, getCurrentUser);

router.route("/updateAccount").patch(verifyJWT, updateAccountDetails);

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
router
  .route("/coverImage")
  .patch(verifyJWT, upload.single("avatar"), updateCoverImage);

router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
