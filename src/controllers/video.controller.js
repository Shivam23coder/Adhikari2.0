import mongoose,{isValidObjectId} from "mongoose"


const getAllVideos = asyncHandler(async(req,res) =>{
    const {page = 1, limit = 10, query, sortBy, sortType, userId} = req.query
    //TODO:Get all videos based on query, sort, pagination
    //Required: video data,
    //sort it and paginate it
    const url = ""
    const options = {method: 'GET', headers: {accept: 'application/json'}};

    try{
        const response = await fetch(url,options);
        const data = await ApiResponse
        ,status(200)
        .json(200,"Videos fetched successfully");
        console.log(data);
    } catch(error) {
        throw new ApiError(200,"Something went wrong while fetching Videos!")
    }
})

const publishAVideo = asyncHandler(async(req,res) =>{
    const {title, description} = req.body
    //TODO: get video,upload on cloudinary,create video
})

const getVideoById = asyncHandler(async(req,res) =>{
    const {videoId} = req.params
    //TODO: get video by Id
})