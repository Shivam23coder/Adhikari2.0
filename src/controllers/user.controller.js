import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessRefreshToken = async(userId) =>{
    try {
        //local variable holding userId
        const user = await User.findById(userId)
        const AccessToken = await user.generateAccessToken();
        const RefreshToken = await user.generateRefreshToken();

        user.RefreshToken = RefreshToken
        await user.save({validateBeforeSave: false})        //await used as it will take some time to save the token

        return {AccessToken,RefreshToken}
        
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
} 

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
    if([fullName,email,username,password].some((fields) =>
        fields?.trim()=== "")){
        throw new ApiError(400,"All fields is required");
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
     
    if(existedUser){
        throw new ApiError(409,"User with this email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    //if avatar is not uploaded successfully
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


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

const loginUser = asyncHandler(async(req,res) =>{
    //req.body -> email,password
    //check if email exists
    //check password
    //access and Refresh Token
    //send cookies

    const{email,username,password} = req.body;
    if(!(username || email)) {
        throw new ApiError(400,"username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(401,"User does not exist")
    }
    
    //user is the object of the user which we get from the database
    //User is the model and user is the object of that model
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid User Credential(Password)")
    }

    const {AccessToken,RefreshToken} = await generateAccessRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // it makes cokkie secure and can only be access by server side(http)
    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("RefreshToken",RefreshToken,cookieOptions)
    .cookie("AccessToken",AccessToken,cookieOptions)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser,AccessToken,RefreshToken
            },"User logged in successfully")
    )
})

const logoutUser = asyncHandler(async(req,res) =>{
    console.log(req.user.fullName);
    User.findByIdAndUpdate(req.user._id,{
        $set: {
            RefreshToken: undefined
        }
    },
    {
        new : true
    }
)

    const options = {
        httpOnly: true,
        secure: true,
    }
return res
    .status(200)
    .clearCookie("RefreshToken")
    .clearCookie("AccessToken")
    .json(
        new ApiResponse(200,{}, "User logged out successfully")
    )
})

const refreshAccessToken = asyncHandler(async(req,res) =>{
    const incomingRefreshToken = req.cookies.refreshToken ||
    req.body.refreshToken


    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    } 

    try {
        //incoming refresh token is the token which is coming from the client
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET  
        )
    
        //getting the user from the database
        const user = await User.findById(decodedToken?._id)
        if(!user)
            throw new ApiError(401,"Invalid Refresh Token")
    
        //if new refresh token is generated for the user does not match with the incoming refresh token
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {AccessToken,RefreshToken} = await generateAccessRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("RefreshToken",RefreshToken,options)
        .cookie("AccessToken",AccessToken,options)
        .json(
            new ApiResponse(200,
                {AccessToken,RefreshToken: newRefreshToken},
                "New Access Token generated successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,"Invalid decoded token ",error?.message)
    }
})

const changeCurrentPassword = asyncHandler(async(req,res) =>{
    const {oldPassword,newPassword} = req.body;    //***oldPassword and newPassword is coming from the client side(from frontend)

    const user = await User.findById(req.user?._id)      //it is a model
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed successfully"))
})

//getting current user
const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(200,req.user,"Current user returned successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullName,email} = req.body
    if(!(fullName || email)) 
        throw new ApiError(400,"All fields are required")

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details updated Successfully"))
})

const updateAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.user?.path      //getting a new image from client

    if(!avatarLocalPath)
        throw new ApiError(400,"Cover file is missing")     

    const avatar = await uploadOnCloudinary(avatarLocalPath)    

    if(!avatar.url)
        throw new ApiError(400,"Error while uploading on avatar")


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"User Avatar updated successfully")
    )
})

const updateCoverImage = asyncHandler(async(req,res) =>{
    const coverImageLocalPath = await req.body.path

    //if does not recieve correct path
    if(!coverImageLocalPath)
        throw new ApiError(400,"CoverImage path is inValid")

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true} 
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"coverImage updated Successfully")
    )

})

const getUserCurrentProfile = asyncHandler(async(req,res) => {
    const {username} = req.params

    if(!username?.trim())
        throw new ApiError(400,"username is missing")

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length)
        throw new ApiError(404,"channel does not Exists")

    return res
    .status
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res) =>{
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "user",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: [
                                        {
                                            fullName: 1,    //it means that we will be sending this data
                                            username: 1,
                                            avatar: 1
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

//Now we will export this function so that we can use it in our routes
export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserCurrentProfile,
    getWatchHistory
};
