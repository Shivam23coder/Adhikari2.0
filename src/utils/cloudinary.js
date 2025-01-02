import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDIANRY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
    try{
        if(!filePath) return null
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload
        (filePath, {
            resourse_type: "auto",
        })  //file has been uploaded successfully
        console.log("File uploaded successfully",response.url);
        return response;
    }   catch(err) {
        fs.unlinkSync(filePath) //remove locally saved file as upload operation failed
        console.log("Error while uploading file on cloudinary",err);
        return null;
    }
}

export {uploadOnCloudinary}