import mongoose from "mongoose";

const projectFileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    language: {
        type: String,
        required: true
    },
    content: {
        type: String
    }
});

const projectSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    files: [projectFileSchema],
    detectedLanguages: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['uploaded', 'processing', 'completed', 'failed'],
        default: 'uploaded'
    }
}, { timestamps: true });

const Project = mongoose.model("Project", projectSchema);
export default Project;