import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDIANRY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (filePath) => {
    try{
        if(!filePath) return null   //if file path is not provided
        //upload file on cloudinary
        const response = await cloudinary.uploader.upload   
        (filePath, {
            resourse_type: "auto",            //Automatically detect the type of file
        })  //file has been uploaded successfully
        console.log("File uploaded successfully",response.url,response.CLOUDIANRY_CLOUD_NAME);
        return response;
    }   catch(err) {
        fs.unlinkSync(filePath) //remove locally saved file as upload operation failed
        console.log("Error while uploading file on cloudinary",err);
        return null;
    }
}

export {uploadOnCloudinary}