import express from "express"
import { signUp, Login, logOut, googleAuth, googleCallback, getCurrentUser, updateProfile } from "../controllers/auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import passport from "passport";
import "../config/passport.js";

const authRouter = express.Router()

// Local authentication
authRouter.post("/signup", signUp)
authRouter.post("/signin", Login)
authRouter.get("/logout", logOut)

// Google OAuth
authRouter.get("/google", googleAuth)
authRouter.get("/google/callback", googleCallback)

// Protected routes
authRouter.get("/me", authenticateToken, getCurrentUser)
authRouter.put("/profile", authenticateToken, updateProfile)

export default authRouter