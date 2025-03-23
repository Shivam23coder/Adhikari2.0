import {Router} from "express";

const router = Router();
import multer from "multer";
import path from "path";

import Blog from "../models/blog.models.js"
import Comment from "../models/comment.models.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";

// // const storage = multer.diskStorage({
// //     destination: function (req, file, cb) {
// //       cb(null, path.resolve(`./public/temp/`));
// //     },
// //     filename: function (req, file, cb) {
// //     //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
// //     //   cb(null, file.fieldname + '-' + uniqueSuffix)
// //         const fileName = `${Date.now()}-${file.originalname}`;
// //         cb(null,fileName);
// //     },
// //   });
  
//   const upload = multer({ storage: storage });

router.get("/add-blog",verifyJWT,upload.fields([
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]), (req,res) =>{
    return res.render("addBlog",{
    user: req.user,     //Since there would be nav bar in the blog page also
    });
});

//to get my blogs
// Backend API endpoint to fetch user's blogs
router.get('/my-blogs',verifyJWT, async (req, res) => {
    try {
        const userId = req.user._id; // Assuming you have user authentication
        const blogs = await Blog.find({ createdBy: userId }); // Fetch blogs from the database
        res.render("myBlogs", 
                    { user: req.user,
                      blogs }); // Render the EJS template and pass the blogs data
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Failed to fetch blogs' });
    }
});

router.get("/:id",verifyJWT, async(req,res) =>{
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    const comments = await Comment.find({ blogId: req.params.id}).populate(
        "createdBy","profileImageURL"
    );

    console.log("comments",comments);
    return res.render("blog",{
        user: req.user,
        blog,
        comments,
    });
});


router.post('/comment/:blogId',async (req,res) =>{
    const comment = await Comment.create({
        content: req.body.content,
        blogId: req.params.blogId,
        createdBy: req.user._id,
    });
    return res.redirect(`/blog/${req.params.blogId}`);
});

// router.post("/blog",async(req,res) => {
    
// })

router.post("/",verifyJWT,upload.single("coverImage"), async (req,res) =>{
    try {
        const {title, body} = req.body;
     
        const coverImageLocalPath = req.file?.path;
     
         const coverImageURL = await uploadOnCloudinary(coverImageLocalPath);
     
        const blog = await Blog.create({
             body,
             title,
             coverImage: coverImageURL?.url || null,
             createdBy: req.user._id,
             // coverImageURL: `/uploads/${req.file.filename}`
        });
        return res.redirect(`/api/v1/user/blog/${blog._id}`);        
    } catch (error) {
        console.error(error); // Log error for debugging
        return res.status(500).json({ message: "An error occurred while creating the blog." });
    }
});

export default router;