import mongoose from "mongoose";

const documentationSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sourceCode: {
        type: String,
        required: false
    },
    sourceLanguage: {
        type: String,
        required: false
    },
    format: {
        type: String,
        enum: ['markdown', 'pdf', 'html'],
        default: 'markdown'
    },
    generatedBy: {
        type: String,
        default: 'gemini-ai'
    },
    downloadCount: {
        type: Number,
        default: 0
    },
    filePath: String
}, { timestamps: true });

const Documentation = mongoose.model("Documentation", documentationSchema);
export default Documentation;