import express from 'express';
import { 
    generateUMLDiagram, 
    getUserUMLDiagrams, 
    getUMLById, 
    deleteUML, 
    regenerateUML, 
    getUMLByProject 
} from '../controllers/uml.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const umlRouter = express.Router();

// All routes require authentication
umlRouter.use(authenticateToken);

// UML routes
umlRouter.post('/generate/:projectId', generateUMLDiagram);
umlRouter.get('/', getUserUMLDiagrams);
umlRouter.get('/:umlId', getUMLById);
umlRouter.delete('/:umlId', deleteUML);
umlRouter.post('/:umlId/regenerate', regenerateUML);
umlRouter.get('/project/:projectId', getUMLByProject);

export default umlRouter;