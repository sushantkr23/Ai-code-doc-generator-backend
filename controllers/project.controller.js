import projectService from '../services/project.service.js';

export const uploadProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        if (!name) {
            return res.status(400).json({ message: 'Project name is required' });
        }

        const project = await projectService.createProject(
            req.user._id,
            { name, description },
            files
        );

        res.status(201).json({
            message: 'Project uploaded successfully',
            project
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await projectService.getUserProjects(req.user._id, page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await projectService.getProjectById(projectId, req.user._id);
        res.status(200).json(project);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        await projectService.deleteProject(projectId, req.user._id);
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const getProjectStats = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await projectService.getProjectById(projectId, req.user._id);
        
        const stats = {
            totalFiles: project.files.length,
            totalSize: project.files.reduce((sum, file) => sum + file.size, 0),
            languages: project.detectedLanguages,
            status: project.status,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        };

        res.status(200).json(stats);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};