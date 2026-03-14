import ChatHistory from '../models/chat-history.model.js';

class ChatHistoryService {
    async saveChat(userId, data) {
        try {
            console.log('💾 Saving chat history for user:', userId);
            console.log('Data received:', {
                language: data.language,
                fileName: data.fileName,
                codeLength: data.code?.length || 0,
                docLength: data.documentation?.length || 0,
                generationType: data.generationType
            });
            
            const title = this.generateTitle(data.code, data.language);
            
            const chatHistory = new ChatHistory({
                userId,
                title,
                language: data.language,
                fileName: data.fileName || 'code-snippet',
                code: data.code,
                documentation: data.documentation,
                codeLength: data.code.length,
                generationType: data.generationType || 'fallback'
            });

            await chatHistory.save();
            console.log('✅ Chat history saved successfully:', chatHistory._id);
            return chatHistory;
        } catch (error) {
            console.error('❌ Failed to save chat history:', error);
            throw new Error(`Failed to save chat history: ${error.message}`);
        }
    }

    async getUserHistory(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;
            
            const history = await ChatHistory.find({ userId })
                .select('title language fileName createdAt codeLength generationType')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await ChatHistory.countDocuments({ userId });

            return {
                history,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    hasNext: skip + limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch history: ${error.message}`);
        }
    }

    async getChatById(chatId, userId) {
        try {
            const chat = await ChatHistory.findOne({ _id: chatId, userId });
            if (!chat) {
                throw new Error('Chat not found');
            }
            return chat;
        } catch (error) {
            throw new Error(`Failed to fetch chat: ${error.message}`);
        }
    }

    async deleteChat(chatId, userId) {
        try {
            const chat = await ChatHistory.findOneAndDelete({ _id: chatId, userId });
            if (!chat) {
                throw new Error('Chat not found');
            }
            return chat;
        } catch (error) {
            throw new Error(`Failed to delete chat: ${error.message}`);
        }
    }

    async clearUserHistory(userId) {
        try {
            const result = await ChatHistory.deleteMany({ userId });
            return result;
        } catch (error) {
            throw new Error(`Failed to clear history: ${error.message}`);
        }
    }

    generateTitle(code, language) {
        // Extract meaningful title from code
        const lines = code.split('\n').filter(line => line.trim());
        
        // Look for class names
        const classMatch = code.match(/class\s+(\w+)/i);
        if (classMatch) {
            return `${classMatch[1]} - ${language.toUpperCase()}`;
        }

        // Look for function names
        const functionMatch = code.match(/(?:function\s+(\w+)|def\s+(\w+)|public\s+\w+\s+(\w+)\s*\()/i);
        if (functionMatch) {
            const funcName = functionMatch[1] || functionMatch[2] || functionMatch[3];
            return `${funcName}() - ${language.toUpperCase()}`;
        }

        // Look for main method
        if (code.includes('main')) {
            return `Main Program - ${language.toUpperCase()}`;
        }

        // Default title
        const timestamp = new Date().toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        return `${language.toUpperCase()} Code - ${timestamp}`;
    }
}

export default new ChatHistoryService();