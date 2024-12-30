import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videofile : {
        type: String,   //cloudinary url(sends the data to cloudinary and returns the url)
        required: true,
    },
    thumbnail : {
        type: String,
        required: true,
    },
    title : {
        type: String,
        required: true,
    },
    title : {
        type: String,
        required: true,
    },
    duration:{
        type:Number,
        required: true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished: {
        type: Boolean,
        default: true
    }
})

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",videoSchema);