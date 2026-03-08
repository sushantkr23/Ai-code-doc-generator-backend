import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required: function() {
            return !this.googleId;
        }
    },
    googleId: {
        type: String,
        sparse: true
    },
    avatar: {
        type: String
    },
    provider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    assistantName:{
        type:String,
    },
    assistantImage:{
        type:String,
    },
    history:[
        {type:String}
    ]
},{timestamps:true})

const User = mongoose.model("User",userSchema)
export default User