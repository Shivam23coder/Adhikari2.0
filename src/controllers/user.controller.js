import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req,res) =>{
    // get user data from request body(frontEnd)
    // validation not empty
    // check if user already exists
    // check for images,avatar
    // upload them on cloudinary
    // create user project - create entry in db
    // remove password from response
    // check  for user creation
    // return response

    const {fullName,email,username,password} = req.body;
    console.log(fullName,email,username,password);

    //Adv. method to check if any field is empty
    if([fullName,email,username,password].some((field) =>
        field?.trim()=== "")
){
        throw new ApiError(400,"All fields is required");
    }

    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })
     
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is requird");
    }
    const avatar = await uploadOnCloudinary(avatarLoacalPath);
    const coverImage = await uploadOnCloudinary(coveerImageLocalPath);

    if(!avatar){
        throw new ApiError(500,"Error while uploading images");     //500 is internal server error
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })


    const createdUser = User.findById(user._id).select(
        "-password -refreshToken"
    );
    

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})
//Now we will export this function so that we can use it in our routes
export {registerUser}
