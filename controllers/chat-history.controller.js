import chatHistoryService from '../services/chat-history.service.js';

export const getUserHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await chatHistoryService.getUserHistory(req.user._id, page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getChatById = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await chatHistoryService.getChatById(chatId, req.user._id);
        res.status(200).json(chat);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const deleteChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        await chatHistoryService.deleteChat(chatId, req.user._id);
        res.status(200).json({ message: 'Chat deleted successfully' });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const clearHistory = async (req, res) => {
    try {
        const result = await chatHistoryService.clearUserHistory(req.user._id);
        res.status(200).json({ 
            message: 'History cleared successfully',
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};