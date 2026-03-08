import Project from '../models/project.model.js';
import Documentation from '../models/documentation.model.js';
import ChatHistory from '../models/chat-history.model.js';

class HistoryService {
    async getUserHistory(userId, page = 1, limit = 10, type = '') {
        try {
            const skip = (page - 1) * limit;
            let history = [];

            if (!type || type === 'projects') {
                const projects = await Project.find({ userId })
                    .select('name description status createdAt updatedAt')
                    .sort({ createdAt: -1 })
                    .limit(type ? limit : Math.ceil(limit / 3));
                
                history = history.concat(projects.map(p => ({
                    _id: p._id,
                    type: 'project',
                    name: p.name,
                    description: p.description,
                    status: p.status,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt
                })));
            }

            if (!type || type === 'docs') {
                const docs = await Documentation.find({ userId })
                    .populate('projectId', 'name')
                    .select('title format downloadCount createdAt updatedAt')
                    .sort({ createdAt: -1 })
                    .limit(type ? limit : Math.ceil(limit / 3));
                
                history = history.concat(docs.map(d => ({
                    _id: d._id,
                    type: 'documentation',
                    title: d.title,
                    format: d.format,
                    downloadCount: d.downloadCount,
                    projectId: d.projectId,
                    createdAt: d.createdAt,
                    updatedAt: d.updatedAt
                })));
            }

            if (!type || type === 'chat') {
                const chats = await ChatHistory.find({ userId })
                    .select('title language fileName createdAt')
                    .sort({ createdAt: -1 })
                    .limit(type ? limit : Math.ceil(limit / 3));
                
                history = history.concat(chats.map(c => ({
                    _id: c._id,
                    type: 'chat',
                    title: c.title,
                    language: c.language,
                    fileName: c.fileName,
                    createdAt: c.createdAt
                })));
            }

            // Sort by creation date
            history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            // Apply pagination
            const paginatedHistory = history.slice(skip, skip + limit);

            return {
                history: paginatedHistory,
                pagination: {
                    current: page,
                    total: Math.ceil(history.length / limit),
                    hasNext: skip + limit < history.length,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch history: ${error.message}`);
        }
    }

    async getUserStats(userId) {
        try {
            const [projectCount, docCount, chatCount] = await Promise.all([
                Project.countDocuments({ userId }),
                Documentation.countDocuments({ userId }),
                ChatHistory.countDocuments({ userId })
            ]);

            // Get recent activity (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const [recentProjects, recentDocs, recentChats] = await Promise.all([
                Project.countDocuments({ userId, createdAt: { $gte: weekAgo } }),
                Documentation.countDocuments({ userId, createdAt: { $gte: weekAgo } }),
                ChatHistory.countDocuments({ userId, createdAt: { $gte: weekAgo } })
            ]);

            // Get top languages
            const projects = await Project.find({ userId }).select('detectedLanguages');
            const languageCount = {};
            
            projects.forEach(project => {
                project.detectedLanguages.forEach(lang => {
                    languageCount[lang] = (languageCount[lang] || 0) + 1;
                });
            });

            const topLanguages = Object.entries(languageCount)
                .map(([language, count]) => ({ language, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            return {
                totalStats: {
                    projects: projectCount,
                    documentations: docCount,
                    chats: chatCount,
                    total: projectCount + docCount + chatCount
                },
                recentActivity: {
                    projects: recentProjects,
                    documentations: recentDocs,
                    chats: recentChats,
                    total: recentProjects + recentDocs + recentChats
                },
                topLanguages
            };
        } catch (error) {
            throw new Error(`Failed to fetch stats: ${error.message}`);
        }
    }
}

export default new HistoryService();