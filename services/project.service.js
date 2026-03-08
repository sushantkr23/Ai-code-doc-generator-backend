import Project from '../models/project.model.js';
import fs from 'fs';
import path from 'path';
import geminiService from './gemini.service.js';

class ProjectService {
    async createProject(userId, projectData, files) {
        try {
            const project = new Project({
                userId,
                name: projectData.name,
                description: projectData.description,
                files: [],
                detectedLanguages: [],
                status: 'uploaded'
            });

            // Process uploaded files
            const processedFiles = [];
            const languages = new Set();

            for (const file of files) {
                const content = fs.readFileSync(file.path, 'utf8');
                const language = geminiService.detectLanguage(file.originalname, content);
                
                languages.add(language);
                
                processedFiles.push({
                    filename: file.filename,
                    originalName: file.originalname,
                    path: file.path,
                    size: file.size,
                    language: language,
                    content: content
                });
            }

            project.files = processedFiles;
            project.detectedLanguages = Array.from(languages);
            project.status = 'completed';

            await project.save();
            return project;
        } catch (error) {
            throw new Error(`Project creation failed: ${error.message}`);
        }
    }

    async getUserProjects(userId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            
            const projects = await Project.find({ userId })
                .select('-files.content') // Exclude file content for list view
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Project.countDocuments({ userId });

            return {
                projects,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    hasNext: skip + limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch projects: ${error.message}`);
        }
    }

    async getProjectById(projectId, userId) {
        try {
            const project = await Project.findOne({ _id: projectId, userId });
            if (!project) {
                throw new Error('Project not found');
            }
            return project;
        } catch (error) {
            throw new Error(`Failed to fetch project: ${error.message}`);
        }
    }

    async deleteProject(projectId, userId) {
        try {
            const project = await Project.findOneAndDelete({ _id: projectId, userId });
            if (!project) {
                throw new Error('Project not found');
            }

            // Clean up uploaded files
            project.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });

            return project;
        } catch (error) {
            throw new Error(`Failed to delete project: ${error.message}`);
        }
    }
}

export default new ProjectService();