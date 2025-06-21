import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import mongoose from "mongoose";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies?.AccessToken || req.headers["Authorization"]?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Access Denied");
        }

        // Verify the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log("Decoded Token:", decodedToken); // Debugging

        // Find the user by ID and exclude sensitive fields
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access token");
        }

        // Attach the user to the request object
        req.user = user;
        console.log("User:", req.user); // Debugging
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});