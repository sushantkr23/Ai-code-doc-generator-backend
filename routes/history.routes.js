import express from 'express';
import { 
    getUserHistory, 
    getUserStats, 
    searchHistory,
    getHistoryItemDetail
} from '../controllers/history.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const historyRouter = express.Router();

// All routes require authentication
historyRouter.use(authenticateToken);

// History routes
historyRouter.get('/', getUserHistory);
historyRouter.get('/stats', getUserStats);
historyRouter.get('/search', searchHistory);
historyRouter.get('/:type/:id', getHistoryItemDetail);

export default historyRouter;