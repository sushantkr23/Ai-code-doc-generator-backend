import genToken from "../config/token.js"
import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import passport from "passport"


export const signUp = async (req,res)=>{
    try {
        const {name,email,password}=req.body
        
        if(!name || !email || !password){
            return res.status(400).json({message:"Name, email and password are required"})
        }
        
        const existEmail=await User.findOne({email})
        if(existEmail){
            return res.status(400).json({message:"User already exists with this email"})
        }
        
        if(password.length<6){
            return res.status(400).json({message:"Password must be at least 6 characters"})
        }

        const hashedPassword = await bcrypt.hash(password,10)
        const user = await User.create({
            name,password:hashedPassword,email
        })

        const token = await genToken(user._id)

        res.cookie("token",token,{
            httpOnly:true,
            maxAge:7*24*60*60*1000,
            sameSite:"strict",
            secure:false
        })

        return res.status(201).json(user)
    } catch (error) {
        return res.status(500).json({message:`sign up error ${error}`})
    }
}

export const Login = async (req,res)=>{
    try {
        const {email,password}=req.body
        
        if(!email || !password){
            return res.status(400).json({message:"Email and password are required"})
        }
        
        const user=await User.findOne({email})
        if(!user){
            return res.status(400).json({message:"User not found with this email"})
        }
        
        // Check if user has password (not Google OAuth user)
        if(!user.password){
            return res.status(400).json({message:"Please login with Google"})
        }
        
        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch){
            return res.status(400).json({message:"Incorrect password"})
        }

        const token = await genToken(user._id)

        res.cookie("token",token,{
            httpOnly:true,
            maxAge:7*24*60*60*1000,
            sameSite:"strict",
            secure:false
        })

        return res.status(200).json(user)
    } catch (error) {
        return res.status(500).json({message:`login error ${error}`})
    }
}

export const logOut = async (req,res)=>{
    try {
        res.clearCookie("token")
        return res.status(200).json({message:"log out successfully"})
    } catch (error) {
         return res.status(500).json({message:`log out error ${error}`})
    }
}

// Google OAuth
export const googleAuth = (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({ message: 'Google OAuth not configured' });
    }
    return passport.authenticate('google', {
        scope: ['profile', 'email']
    })(req, res, next);
};

export const googleCallback = async (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return res.status(400).json({ message: 'Google OAuth not configured' });
    }
    
    passport.authenticate('google', async (err, user) => {
        try {
            if (err) {
                return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_error`);
            }
            
            if (!user) {
                return res.redirect(`${process.env.CLIENT_URL}/login?error=oauth_failed`);
            }

            const token = await genToken(user._id);
            
            res.cookie("token", token, {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000,
                sameSite: "strict",
                secure: false
            });

            res.redirect(`${process.env.CLIENT_URL}/dashboard`);
        } catch (error) {
            res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
        }
    })(req, res, next);
};

// Get current user
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: `Error fetching user: ${error.message}` });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const { name, assistantName } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { name, assistantName },
            { new: true }
        ).select('-password');
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: `Profile update error: ${error.message}` });
    }
}