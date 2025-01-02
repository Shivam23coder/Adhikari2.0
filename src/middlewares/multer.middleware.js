import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req,file, cb) {
        cb(null,"./public/temp")
    },
    filename: function(req,file,cb){
        cb(null,file.originalname)  //file.originalname is the name of the file on the user's computer
    }
})

export const upload = multer({
    storage,
})