import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";

import {User} from "../models/user.models.js";
import {Subscription} from "../models/subscription.models.js" ;
import Blog from "../models/blog.models.js";
import categories from "../models/category.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
// import { channel } from "diagnostics_channel";

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

    //<form action="/upload" method="POST" enctype="multipart/form-data">
//     <input type="file" name="avatar" multiple>
//     <button type="submit">Upload</button>
//   </form>

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

    const formData = {
        fullName,
        username,
        email,
        password,
        avatar,
        coverImage
    };

    
    res
    .status(201)
    .json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
    .redirect("/api/v1/user/dashboard");            //how to redirect as well as render a page
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

    //finds on basis of username or email
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

    //generating access token
    const {AccessToken,RefreshToken} = await generateAccessRefreshToken(user._id)

    //contains all info of the user except password and refreshToken
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // it makes cookie secure and can only be access by server side(http)
    const cookieOptions = {
        httpOnly: true,
        secure: true
    }

    res
    .status(200)
    .cookie("RefreshToken",RefreshToken,cookieOptions)
    .cookie("AccessToken",AccessToken,cookieOptions)
    
    .redirect("/api/v1/user/home");         //CHANGES under construction
    

    // res.render('dashboard', { message: 'Logged in successfully', user: req.user });
})

//just clear cookies
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

//create home page
// app.get("/", async (req,res) =>{
//     try{
//         const allBlogs = await Blog.find({});
//         res.render("home",{
//             user: req.user,
//             blogs: allBlogs,
//         });
//     } catch(error){
//     console.error("ERROR FETCHING BLOGS:", error);
//     res.status(500).send("Internal Server Error");
//     }
// });

const homepage = asyncHandler(async (req,res) =>{
    try{
        const allBlogs = await Blog.find({});
        // const categories = await Category.find(); // Fetch categories
        res.render("home",{
            user: req.user || null,
            blogs: allBlogs,
            categories
        });
    } catch(error){
        console.error("ERROR FETCHING BLOGS:", error);
        res.status(500).send("Internal Server Error").json({message: "INTERNAL SERVER ERROR",error: error.message});
    }
  });

//creating a dashboard for seamless user experience
const getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch user details excluding sensitive information (like password)
    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Get the number of blogs written by the user
    const blogCount = await Blog.countDocuments({ createdBy: userId });

    // Fetch the user's channel profile, including the number of subscribers and channels subscribed to
    const channelProfile = await User.aggregate([
        {
            $match: {
                username: user.username.toLowerCase()
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
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
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
    ]);

    if (!channelProfile?.length) {
        throw new ApiError(404, "Channel does not exist");
    }

    // Extract the channel profile data
    const { subscribersCount, channelsSubscribedToCount, isSubscribed, avatar, coverImage, fullName, username, email } = channelProfile[0];

    // Get the user's subscribed channels (optional, if needed)
    
    const subscribedChannels = await Subscription.aggregate([
        { $match: { subscribers: userId } },
        { $project: { _id: 1, channelName: 1 } }
    ]);

    // Get the channels owned by the user (optional)
    // const userChannels = await Channel.aggregate([
    //     { $match: { owner: userId } },
    //     { $lookup: {
    //         from: 'subscribers',
    //         localField: '_id',
    //         foreignField: 'channelId',
    //         as: 'subscribers'
    //     }},
    //     { $project: { _id: 1, channelName: 1, numberOfSubscribers: { $size: "$subscribers" } } }
    // ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Get monthly blog counts for last 6 months
    const monthlyBlogs = await Blog.aggregate([
        {
            $match: {
                createdBy: userId,
                createdAt: { $gte: sixMonthsAgo }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { "_id.year": 1, "_id.month": 1 }
        }
    ]);

    // Generate labels for last 6 months (including months with 0 blogs)
    const monthLabels = [];
    const currentDate = new Date();
    const blogMap = new Map();
    
    monthlyBlogs.forEach(blog => {
        const key = `${blog._id.year}-${blog._id.month}`;
        blogMap.set(key, blog.count);
    });

    // Create array for last 6 months
    const blogHistogramData = [];
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // JS months are 0-indexed
        const key = `${year}-${month}`;
        
        blogHistogramData.push({
            label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
            count: blogMap.get(key) || 0
        });
    }
    // Render template with new data

res.render('dashBoard', {
        user: { fullName, username, email, avatar, coverImage },
        blogHistogramData: JSON.stringify(blogHistogramData),
        blogCount,
        subscribersCount,
        channelsSubscribedToCount,
        isSubscribed,
        subscribedChannels,
        // userChannels,
        title: 'User Dashboard'
    });
});

const getSearchedUser = asyncHandler(async(req,res) => {

    const{username} = req.body;
    if(!(username)) {
        throw new ApiError(400,"username or email is required")
    }

    try {
        const user = await User.findOne({ username: username });
        if (!user) {
          console.log("User not found");
        } 
        else {
          console.log("User found:", user);

          res.render('subscribePage',{
            user: {
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                coverImage: user.coverImage,
                _id: user._id,
            },
          });
        }
      } catch (error) {
        console.error("Error finding user:", error.message);
      }

      //After searching a person(user),show it's info

})

// const subUnsubscribe = asyncHandler(async(req,res) => {
//     // const {fullName,email,username,password} = req.body;
//     // console.log(fullName,email,username,password);

//     const user = await User.create({
//         fullName,
//         avatar: avatar.url,
//         coverImage: coverImage?.url || "",
//         email,
//         password,
//         username: username.toLowerCase()
//     })

//     const subscriptionDetails = await Subscription.create({
//         subscriber,
//         channel
//     })
    
// })

const subscribeToUser = asyncHandler(async (req, res) => {
    console.log("Subscribe request received:", req.body); 
    
    const { channelId } = req.body; // ID of the user to subscribe to
    const subscriberId = req.user._id; // ID of the logged-in user

    if (!channelId) {
        throw new ApiError(400, "Channel ID is required");
    }

    if (channelId === subscriberId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    // Check if the subscription already exists
    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId,
    });

    if (existingSubscription) {
        throw new ApiError(400, "You are already subscribed to this channel");
    }

    // Create the subscription
    const newSubscription = await Subscription.create({
        channel: channelId,
        subscriber: subscriberId,
    });

    return res.status(201).json(
        new ApiResponse(201, newSubscription, "Subscription created successfully")
    );
});

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
    .json(new ApiResponse(200,{},"Password changed successfully.Please go to the home page for again login"))
})

//getting current user
const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(200,req.user,"Current user returned successfully")
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullName,email,username} = req.body
    if(!(fullName || email || username)) 
        throw new ApiError(400,"All fields are required")

    //getting the current user's info
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName : fullName,
                email: email,
                username: username
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
    const coverImageLocalPath = await req.body.path     //for getting the path if image

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


//this gets number of subscribers and the channels to which user has subscribed

const getUserChannelProfile = asyncHandler(async(req,res) => {
    //first I get username from the client(frontend) by req.params
    const {username} = req.params

    //if no string is present
    if(!username?.trim())
        throw new ApiError(400,"username is missing")

    //aggregation pipeline for making changes
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
            //it helps in retrieving all subscriptions associated with each user
            //  by joining their 'id' with subscriber field
            
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
    homepage,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getSearchedUser,
    getWatchHistory,
    getDashboard,
    subscribeToUser
};
