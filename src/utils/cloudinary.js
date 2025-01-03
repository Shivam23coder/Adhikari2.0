import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    // secure: true
});

const uploadOnCloudinary = async (filePath) => {
    try{
        if(!filePath) return null   //if file path is not provided

        //upload file on cloudinary
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",                  //Automatically detect the type of file
        })                                          //file has been uploaded successfully

        console.log("File uploaded successfully",response.url);
        return response;

    }   catch(err) {
        console.error("Error while uploading file on cloudinary:", err.message);
        console.error("Stack trace:", err.stack);
        fs.unlinkSync(filePath)                 //remove locally saved file as upload operation failed
        console.log("Error while uploading file on cloudinary",err);
        return null;
    }
}

export {uploadOnCloudinary};