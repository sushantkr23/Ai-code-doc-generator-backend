import express from 'express';
import { 
    getUserHistory, 
    getChatById, 
    deleteChat, 
    clearHistory 
} from '../controllers/chat-history.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const chatHistoryRouter = express.Router();

// All routes require authentication
chatHistoryRouter.use(authenticateToken);

// History routes
chatHistoryRouter.get('/', getUserHistory);
chatHistoryRouter.get('/:chatId', getChatById);
chatHistoryRouter.delete('/:chatId', deleteChat);
chatHistoryRouter.delete('/', clearHistory);

export default chatHistoryRouter;