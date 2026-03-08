import umlService from '../services/uml.service.js';

export const generateUMLDiagram = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { diagramType = 'class' } = req.body;

        const validTypes = ['class', 'sequence', 'activity', 'usecase'];
        if (!validTypes.includes(diagramType)) {
            return res.status(400).json({ 
                message: 'Invalid diagram type. Allowed types: class, sequence, activity, usecase' 
            });
        }

        const umlDiagram = await umlService.generateUMLDiagram(
            projectId,
            req.user._id,
            diagramType
        );

        res.status(201).json({
            message: 'UML diagram generated successfully',
            diagram: umlDiagram
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserUMLDiagrams = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await umlService.getUserUMLDiagrams(req.user._id, page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUMLById = async (req, res) => {
    try {
        const { umlId } = req.params;
        const umlDiagram = await umlService.getUMLById(umlId, req.user._id);
        res.status(200).json(umlDiagram);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const deleteUML = async (req, res) => {
    try {
        const { umlId } = req.params;
        await umlService.deleteUML(umlId, req.user._id);
        res.status(200).json({ message: 'UML diagram deleted successfully' });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const regenerateUML = async (req, res) => {
    try {
        const { umlId } = req.params;
        const { diagramType } = req.body;

        const validTypes = ['class', 'sequence', 'activity', 'usecase'];
        if (!validTypes.includes(diagramType)) {
            return res.status(400).json({ 
                message: 'Invalid diagram type. Allowed types: class, sequence, activity, usecase' 
            });
        }

        const updatedDiagram = await umlService.regenerateUMLDiagram(
            umlId,
            req.user._id,
            diagramType
        );

        res.status(200).json({
            message: 'UML diagram regenerated successfully',
            diagram: updatedDiagram
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUMLByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const diagrams = await umlService.getUserUMLDiagrams(req.user._id);
        
        const projectDiagrams = diagrams.diagrams.filter(
            diagram => diagram.projectId._id.toString() === projectId
        );

        res.status(200).json({ diagrams: projectDiagrams });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};