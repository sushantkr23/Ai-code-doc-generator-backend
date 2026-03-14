import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

console.log('🔐 Passport Config Loading...');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Found' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Found' : 'Missing');

const callbackURL = process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 8000}/api/auth/google/callback`;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: callbackURL
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('✅ Google OAuth callback received for:', profile.emails[0].value);
        
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });
        
        if (user) {
            console.log('✅ Existing user found with Google ID');
            return done(null, user);
        }
        
        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });
        
        if (user) {
            console.log('✅ Linking Google account to existing user');
            // Link Google account to existing user
            user.googleId = profile.id;
            user.provider = 'google';
            user.avatar = profile.photos[0].value;
            await user.save();
            return done(null, user);
        }
        
        // Create new user
        console.log('✅ Creating new user with Google account');
        user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value,
            provider: 'google'
        });
        
        await user.save();
        done(null, user);
    } catch (error) {
        console.error('❌ Google OAuth error:', error);
        done(error, null);
    }
}));

console.log('✅ Google Strategy registered successfully');

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;