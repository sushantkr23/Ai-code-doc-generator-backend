import express from 'express';
import { 
    uploadProject, 
    getUserProjects, 
    getProjectById, 
    deleteProject, 
    getProjectStats 
} from '../controllers/project.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { uploadFiles, handleUploadError } from '../middlewares/upload.middleware.js';

const projectRouter = express.Router();

// All routes require authentication
projectRouter.use(authenticateToken);

// Project routes
projectRouter.post('/upload', uploadFiles, handleUploadError, uploadProject);
projectRouter.get('/', getUserProjects);
projectRouter.get('/:projectId', getProjectById);
projectRouter.delete('/:projectId', deleteProject);
projectRouter.get('/:projectId/stats', getProjectStats);

export default projectRouter;