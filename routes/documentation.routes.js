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
import { authenticateToken } from '../middlewares/auth.middleware.js';

const documentationRouter = express.Router();

// All routes require authentication
documentationRouter.use(authenticateToken);

// Documentation routes
documentationRouter.post('/generate/:projectId', generateDocumentation);
documentationRouter.post('/generate-from-code', generateFromCode);
documentationRouter.post('/generate-pdf', generatePDFFromCode);
documentationRouter.get('/', getUserDocumentations);
documentationRouter.get('/:docId', getDocumentationById);
documentationRouter.get('/:docId/download', downloadDocumentation);
documentationRouter.delete('/:docId', deleteDocumentation);
documentationRouter.post('/:docId/regenerate', regenerateDocumentation);

export default documentationRouter;