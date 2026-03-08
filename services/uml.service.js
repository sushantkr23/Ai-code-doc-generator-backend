import UML from '../models/uml.model.js';
import Project from '../models/project.model.js';
import geminiService from './gemini.service.js';
import plantumlEncoder from 'plantuml-encoder';
import axios from 'axios';

class UMLService {
    async generateUMLDiagram(projectId, userId, diagramType = 'class') {
        try {
            const project = await Project.findOne({ _id: projectId, userId });
            if (!project) {
                throw new Error('Project not found');
            }

            let combinedCode = '';
            for (const file of project.files) {
                combinedCode += `// File: ${file.originalName}\n${file.content}\n\n`;
            }

            const plantUMLCode = await geminiService.generateUMLDiagram(
                combinedCode,
                project.detectedLanguages.join(', '),
                diagramType
            );

            // Generate diagram image URL using PlantUML server
            const encoded = plantumlEncoder.encode(plantUMLCode);
            const imageUrl = `http://www.plantuml.com/plantuml/png/${encoded}`;

            const uml = new UML({
                projectId,
                userId,
                diagramType,
                plantUMLCode: plantUMLCode.replace(/```plantuml|```/g, '').trim(),
                imageUrl,
                title: `${project.name} - ${diagramType.charAt(0).toUpperCase() + diagramType.slice(1)} Diagram`
            });

            return await uml.save();
        } catch (error) {
            throw new Error(`UML generation failed: ${error.message}`);
        }
    }

    async getUserUMLDiagrams(userId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const diagrams = await UML.find({ userId })
                .populate('projectId', 'name description')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await UML.countDocuments({ userId });
            
            return {
                diagrams,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    hasNext: skip + limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch UML diagrams: ${error.message}`);
        }
    }

    async getUMLById(umlId, userId) {
        try {
            const uml = await UML.findOne({ _id: umlId, userId })
                .populate('projectId', 'name description');
            
            if (!uml) {
                throw new Error('UML diagram not found');
            }

            return uml;
        } catch (error) {
            throw new Error(`Failed to fetch UML diagram: ${error.message}`);
        }
    }

    async deleteUML(umlId, userId) {
        try {
            const uml = await UML.findOneAndDelete({ _id: umlId, userId });
            if (!uml) {
                throw new Error('UML diagram not found');
            }

            return uml;
        } catch (error) {
            throw new Error(`Failed to delete UML diagram: ${error.message}`);
        }
    }

    async regenerateUMLDiagram(umlId, userId, newDiagramType) {
        try {
            const existingUML = await UML.findOne({ _id: umlId, userId });
            if (!existingUML) {
                throw new Error('UML diagram not found');
            }

            const project = await Project.findById(existingUML.projectId);
            if (!project) {
                throw new Error('Associated project not found');
            }

            let combinedCode = '';
            for (const file of project.files) {
                combinedCode += `// File: ${file.originalName}\n${file.content}\n\n`;
            }

            const plantUMLCode = await geminiService.generateUMLDiagram(
                combinedCode,
                project.detectedLanguages.join(', '),
                newDiagramType
            );

            const encoded = plantumlEncoder.encode(plantUMLCode);
            const imageUrl = `http://www.plantuml.com/plantuml/png/${encoded}`;

            existingUML.diagramType = newDiagramType;
            existingUML.plantUMLCode = plantUMLCode.replace(/```plantuml|```/g, '').trim();
            existingUML.imageUrl = imageUrl;
            existingUML.title = `${project.name} - ${newDiagramType.charAt(0).toUpperCase() + newDiagramType.slice(1)} Diagram`;

            return await existingUML.save();
        } catch (error) {
            throw new Error(`UML regeneration failed: ${error.message}`);
        }
    }
}

export default new UMLService();