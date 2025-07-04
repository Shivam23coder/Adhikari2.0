import mongoose,{Schema} from "mongoose";
// import {model,Schema} from "mongoose";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true //to make a field searchable make index true(to enable searching field)
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName : {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,   //cloudinary url
        },
        // watchHistory: [
        //     {
        //     type: Schema.Types.ObjectId,
        //     ref: "Video"
        //     }
        // ],
        password: {
            type: String,
            required: [true, 'Password is required'],
        },
        refreshToken : {
            type: String
        }
    },{timestamp: true}
)

//pre save hook to hash password before saving user(i.e., on saving user password will be hashed)
userSchema.pre("save",async function(next) {
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("user", userSchema);
// const User = model("User", userSchema);

// export default User;