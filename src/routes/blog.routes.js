const {Router} = require("express");
const router = Router();
const multer = require("multer");
const path = require("path");

const Blog = require('../models/blog.models');
const Comment = require("../models/comment.models");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.resolve(`./public/uploads/`));
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    //   cb(null, file.fieldname + '-' + uniqueSuffix)
        const fileName = `${Date.now()}-${file.originalname}`;
        cb(null,fileName);
    },
  });
  
  const upload = multer({ storage: storage });

router.get("/add-new", (req,res) =>{
    return res.render("addBlog",{
        user: req.user,     //Since there would be nav bar in the blog page also
    });
});

router.get("/:id", async(req,res) =>{
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


router.post("/",upload.single("coverImage"), async (req,res) =>{
   const {title, body} = req.body;
   const blog = await Blog.create({
        body,
        title,
        createdBy: req.user._id,
        // coverImageURL: `/uploads/${req.file.filename}`
   });
   return res.redirect(`/blog/${blog._id}`);
});

module.exports = router;