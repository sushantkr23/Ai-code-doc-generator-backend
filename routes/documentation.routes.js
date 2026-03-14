import express from 'express';
import { 
    generateDocumentation, 
    getUserDocumentations, 
    getDocumentationById, 
    downloadDocumentation, 
    deleteDocumentation, 
    regenerateDocumentation,
    generateFromCode,
    generatePDFFromCode
} from '../controllers/documentation.controller.js';
import { authenticateToken, optionalAuth } from '../middlewares/auth.middleware.js';

const documentationRouter = express.Router();

// Public routes (no login required)
documentationRouter.post('/generate-from-code', optionalAuth, generateFromCode);
documentationRouter.post('/generate-pdf', optionalAuth, generatePDFFromCode);

// Protected routes (login required)
documentationRouter.post('/generate/:projectId', authenticateToken, generateDocumentation);
documentationRouter.get('/', authenticateToken, getUserDocumentations);
documentationRouter.get('/:docId', authenticateToken, getDocumentationById);
documentationRouter.get('/:docId/download', authenticateToken, downloadDocumentation);
documentationRouter.delete('/:docId', authenticateToken, deleteDocumentation);
documentationRouter.post('/:docId/regenerate', authenticateToken, regenerateDocumentation);

export default documentationRouter;