# AI Code Documentation Generator - Backend

A powerful backend API for generating AI-powered documentation and UML diagrams from code files using Google's Gemini AI.

## 🚀 Features

### Authentication & User Management
- **Local Authentication**: Email/password registration and login
- **Google OAuth**: Continue with Google integration
- **JWT Token**: Secure authentication with HTTP-only cookies
- **User Profile**: Update profile and assistant settings

### Code Upload & Project Management
- **Multi-file Upload**: Support for 20+ programming languages
- **Automatic Language Detection**: Smart detection of programming languages
- **Project Organization**: Group related files into projects
- **File Management**: View, organize, and delete uploaded files

### AI Documentation Generator
- **Gemini AI Integration**: Powered by Google's Gemini Pro model
- **Multi-language Support**: JavaScript, Python, Java, C++, and more
- **Comprehensive Docs**: Function, class, and method documentation
- **Multiple Formats**: Markdown and PDF output
- **Smart Analysis**: AST-based code analysis with AI insights

### UML Diagram Generator
- **Multiple Diagram Types**: Class, Sequence, Activity, Use Case diagrams
- **PlantUML Integration**: Generate professional UML diagrams
- **Visual Output**: PNG images via PlantUML server
- **Code Analysis**: AI-powered structure analysis

### History & Analytics
- **Activity Tracking**: Complete history of projects and generations
- **Usage Statistics**: Track documentation and diagram generation
- **Search Functionality**: Find past projects and documents
- **Download Analytics**: Track document downloads

## 🛠️ Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **AI**: Google Gemini Pro API
- **Authentication**: JWT + Passport.js (Google OAuth)
- **File Upload**: Multer with validation
- **PDF Generation**: PDF-lib
- **UML**: PlantUML with encoder

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Google Cloud Account (for Gemini AI API)
- Google OAuth App (for social login)

## ⚙️ Installation

1. **Clone and Navigate**
   ```bash
   cd "Mern Project/VirtualAssistant/backend"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Update `.env` file with your credentials:
   ```env
   PORT=8000
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   CLIENT_URL=http://localhost:3000
   ```

4. **Get API Keys**

   **Gemini AI API:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Add to `GEMINI_API_KEY` in .env

   **Google OAuth:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:8000/api/auth/google/callback`
   - Add client ID and secret to .env

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/signup          # Register new user
POST /api/auth/signin          # Login user
GET  /api/auth/logout          # Logout user
GET  /api/auth/google          # Google OAuth login
GET  /api/auth/google/callback # Google OAuth callback
GET  /api/auth/me              # Get current user (Protected)
PUT  /api/auth/profile         # Update profile (Protected)
```

### Project Management

```http
POST /api/projects/upload      # Upload code files
GET  /api/projects             # Get user projects
GET  /api/projects/:id         # Get project details
DELETE /api/projects/:id       # Delete project
GET  /api/projects/:id/stats   # Get project statistics
```

### Documentation Generation

```http
POST /api/documentation/generate/:projectId  # Generate documentation
GET  /api/documentation                      # Get user documentations
GET  /api/documentation/:id                  # Get documentation details
GET  /api/documentation/:id/download         # Download documentation
DELETE /api/documentation/:id                # Delete documentation
POST /api/documentation/:id/regenerate       # Regenerate documentation
```

### UML Diagram Generation

```http
POST /api/uml/generate/:projectId    # Generate UML diagram
GET  /api/uml                        # Get user UML diagrams
GET  /api/uml/:id                    # Get UML diagram details
DELETE /api/uml/:id                  # Delete UML diagram
POST /api/uml/:id/regenerate         # Regenerate UML diagram
GET  /api/uml/project/:projectId     # Get UML diagrams by project
```

### History & Analytics

```http
GET /api/history              # Get user activity history
GET /api/history/stats        # Get user statistics
GET /api/history/search       # Search history
```

## 🔧 Supported File Types

**Programming Languages:**
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp)
- C# (.cs)
- PHP (.php)
- Ruby (.rb)
- Go (.go)
- Rust (.rs)
- Kotlin (.kt)
- Swift (.swift)

**Configuration & Markup:**
- JSON (.json)
- XML (.xml)
- YAML (.yml, .yaml)
- HTML (.html)
- CSS (.css)
- SQL (.sql)
- Shell (.sh)
- Markdown (.md)

## 🚦 Usage Examples

### 1. Upload Project
```javascript
const formData = new FormData();
formData.append('name', 'My React App');
formData.append('description', 'A sample React application');
formData.append('files', file1);
formData.append('files', file2);

fetch('/api/projects/upload', {
  method: 'POST',
  body: formData
});
```

### 2. Generate Documentation
```javascript
fetch('/api/documentation/generate/PROJECT_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ format: 'pdf' })
});
```

### 3. Generate UML Diagram
```javascript
fetch('/api/uml/generate/PROJECT_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ diagramType: 'class' })
});
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **HTTP-Only Cookies**: Prevent XSS attacks
- **File Validation**: Strict file type and size validation
- **Rate Limiting**: Prevent API abuse
- **CORS Configuration**: Secure cross-origin requests
- **Input Sanitization**: Prevent injection attacks

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js              # Database connection
│   ├── passport.js        # Google OAuth config
│   └── token.js           # JWT utilities
├── controllers/
│   ├── auth.controller.js      # Authentication logic
│   ├── project.controller.js   # Project management
│   ├── documentation.controller.js # Doc generation
│   ├── uml.controller.js       # UML generation
│   └── history.controller.js   # History & analytics
├── middlewares/
│   ├── auth.middleware.js      # JWT validation
│   └── upload.middleware.js    # File upload handling
├── models/
│   ├── user.model.js          # User schema
│   ├── project.model.js       # Project schema
│   ├── documentation.model.js # Documentation schema
│   └── uml.model.js           # UML schema
├── routes/
│   ├── auth.routes.js         # Auth endpoints
│   ├── project.routes.js      # Project endpoints
│   ├── documentation.routes.js # Doc endpoints
│   ├── uml.routes.js          # UML endpoints
│   └── history.routes.js      # History endpoints
├── services/
│   ├── gemini.service.js      # AI integration
│   ├── project.service.js     # Project business logic
│   ├── documentation.service.js # Doc business logic
│   └── uml.service.js         # UML business logic
├── uploads/                   # File storage
├── .env                      # Environment variables
├── index.js                  # Server entry point
└── package.json              # Dependencies
```

## 🐛 Troubleshooting

### Common Issues

1. **Gemini API Errors**
   - Verify API key is correct
   - Check API quotas and billing
   - Ensure proper network connectivity

2. **File Upload Issues**
   - Check file size limits (10MB per file)
   - Verify file type is supported
   - Ensure upload directory permissions

3. **Google OAuth Issues**
   - Verify redirect URI configuration
   - Check client ID and secret
   - Ensure Google+ API is enabled

4. **MongoDB Connection**
   - Verify connection string
   - Check network connectivity
   - Ensure database permissions

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=8000
MONGODB_URL=your_production_mongodb_url
JWT_SECRET=your_strong_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=https://your-frontend-domain.com
```

### Production Considerations
- Use HTTPS in production
- Set secure cookie flags
- Configure proper CORS origins
- Set up rate limiting
- Use environment-specific configurations
- Set up logging and monitoring

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Sushant Kumar**
- Backend Developer
- AI Integration Specialist

---

🎉 **Your AI Code Documentation Generator backend is ready!** Start the server and begin generating intelligent documentation for your code projects.