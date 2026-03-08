import mongoose from "mongoose";

const umlSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    diagramType: {
        type: String,
        enum: ['class', 'sequence', 'activity', 'usecase'],
        default: 'class'
    },
    plantUMLCode: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String
    }
}, { timestamps: true });

const UML = mongoose.model("UML", umlSchema);
export default UML;