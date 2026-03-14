import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import connectDb from "./config/db.js"
import cookieParser from "cookie-parser"
import session from "express-session"
import passport from "passport"
import "./config/passport.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url'

dotenv.config()

// Import routes
import authRouter from "./routes/auth.routes.js"
import projectRouter from "./routes/project.routes.js"
import documentationRouter from "./routes/documentation.routes.js"
import umlRouter from "./routes/uml.routes.js"
import historyRouter from "./routes/history.routes.js"
import chatHistoryRouter from "./routes/chat-history.routes.js"

const app = express()
const port = process.env.PORT || 5000

// Create upload directories
const uploadDirs = ['uploads/projects', 'uploads/docs'];
uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Middleware
app.use(cors({
    origin: [process.env.CLIENT_URL || "http://localhost:4200", "http://localhost:3000", "http://localhost:4200"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.JWT_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);
app.use("/api/documentation", documentationRouter);
app.use("/api/uml", umlRouter);
app.use("/api/history", historyRouter);
app.use("/api/chat-history", chatHistoryRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'AI Code Documentation Generator API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(port, () => {
    connectDb();
    console.log(`🚀 AI Code Documentation Generator Server running on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/health`);
    console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
    console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not Configured'}`);
})



// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DEBUG: Check .env loading
console.log('=== ENV DEBUG START ===');
console.log('Current directory:', __dirname);

// Load .env with explicit path
const envPath = path.join(__dirname, '.env');
console.log('.env path:', envPath);

// Check if .env exists
if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    const geminiLine = lines.find(line => line.includes('GEMINI_API_KEY'));
    console.log('GEMINI_API_KEY line in file:', geminiLine ? 'Found' : 'Not found');
    if (geminiLine) {
        console.log('Key preview:', geminiLine.substring(0, 30) + '...');
    }
} else {
    console.log('❌ .env file NOT found');
}

// Load environment variables
dotenv.config({ path: envPath });

// DEBUG: Check loaded values
console.log('🔑 GEMINI_API_KEY from process.env:', 
    process.env.GEMINI_API_KEY 
    ? `✅ Loaded (${process.env.GEMINI_API_KEY.length} chars)` 
    : '❌ NOT LOADED'
);

console.log('PORT:', process.env.PORT);
console.log('MONGODB_URL:', process.env.MONGODB_URL ? '✅ Loaded' : '❌ Not loaded');
console.log('=== ENV DEBUG END ===\n');

// Rest of your code remains same...