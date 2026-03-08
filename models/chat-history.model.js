import mongoose from "mongoose";

const chatHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        default: 'code-snippet'
    },
    code: {
        type: String,
        required: true
    },
    documentation: {
        type: String,
        required: true
    },
    codeLength: {
        type: Number,
        default: 0
    },
    generationType: {
        type: String,
        enum: ['ai', 'fallback', 'code-snippet'],
        default: 'fallback'
    }
}, { timestamps: true });

// Index for faster queries
chatHistorySchema.index({ userId: 1, createdAt: -1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
export default ChatHistory;