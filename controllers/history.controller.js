import Documentation from '../models/documentation.model.js';
import UML from '../models/uml.model.js';
import Project from '../models/project.model.js';
import ChatHistory from '../models/chat-history.model.js';

export const getUserHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type; // 'projects', 'docs', 'umls', or 'all'

        const skip = (page - 1) * limit;
        let history = [];

        if (!type || type === 'all') {
            // Get all activities including chat history
            const [projects, docs, umls, chats] = await Promise.all([
                Project.find({ userId: req.user._id })
                    .select('name description status createdAt updatedAt')
                    .sort({ createdAt: -1 })
                    .limit(limit),
                Documentation.find({ userId: req.user._id })
                    .populate('projectId', 'name')
                    .select('title format downloadCount sourceCode sourceLanguage createdAt')
                    .sort({ createdAt: -1 })
                    .limit(limit),
                UML.find({ userId: req.user._id })
                    .populate('projectId', 'name')
                    .select('title diagramType createdAt')
                    .sort({ createdAt: -1 })
                    .limit(limit),
                ChatHistory.find({ userId: req.user._id })
                    .select('title language fileName createdAt codeLength generationType')
                    .sort({ createdAt: -1 })
                    .limit(limit)
            ]);

            // Combine and sort by date
            history = [
                ...projects.map(p => ({ ...p.toObject(), type: 'project' })),
                ...docs.map(d => ({ ...d.toObject(), type: 'documentation' })),
                ...umls.map(u => ({ ...u.toObject(), type: 'uml' })),
                ...chats.map(c => ({ ...c.toObject(), type: 'chat', name: c.title }))
            ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
             .slice(0, limit);
        } else {
            // Get specific type
            switch (type) {
                case 'projects':
                    const projects = await Project.find({ userId: req.user._id })
                        .select('name description status createdAt updatedAt')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit);
                    history = projects.map(p => ({ ...p.toObject(), type: 'project' }));
                    break;
                
                case 'docs':
                    const docs = await Documentation.find({ userId: req.user._id })
                        .populate('projectId', 'name')
                        .select('title format downloadCount sourceCode sourceLanguage createdAt')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit);
                    history = docs.map(d => ({ ...d.toObject(), type: 'documentation' }));
                    break;
                
                case 'umls':
                    const umls = await UML.find({ userId: req.user._id })
                        .populate('projectId', 'name')
                        .select('title diagramType createdAt')
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit);
                    history = umls.map(u => ({ ...u.toObject(), type: 'uml' }));
                    break;
                
                default:
                    return res.status(400).json({ message: 'Invalid type parameter' });
            }
        }

        res.status(200).json({
            history,
            pagination: {
                current: page,
                hasNext: history.length === limit,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserStats = async (req, res) => {
    try {
        const [projectCount, docCount, umlCount] = await Promise.all([
            Project.countDocuments({ userId: req.user._id }),
            Documentation.countDocuments({ userId: req.user._id }),
            UML.countDocuments({ userId: req.user._id })
        ]);

        // Get recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [recentProjects, recentDocs, recentUmls] = await Promise.all([
            Project.countDocuments({ 
                userId: req.user._id, 
                createdAt: { $gte: thirtyDaysAgo } 
            }),
            Documentation.countDocuments({ 
                userId: req.user._id, 
                createdAt: { $gte: thirtyDaysAgo } 
            }),
            UML.countDocuments({ 
                userId: req.user._id, 
                createdAt: { $gte: thirtyDaysAgo } 
            })
        ]);

        // Get most used languages
        const projects = await Project.find({ userId: req.user._id })
            .select('detectedLanguages');
        
        const languageCount = {};
        projects.forEach(project => {
            project.detectedLanguages.forEach(lang => {
                languageCount[lang] = (languageCount[lang] || 0) + 1;
            });
        });

        const topLanguages = Object.entries(languageCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([lang, count]) => ({ language: lang, count }));

        res.status(200).json({
            totalStats: {
                projects: projectCount,
                documentations: docCount,
                umlDiagrams: umlCount,
                total: projectCount + docCount + umlCount
            },
            recentActivity: {
                projects: recentProjects,
                documentations: recentDocs,
                umlDiagrams: recentUmls,
                total: recentProjects + recentDocs + recentUmls
            },
            topLanguages
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const searchHistory = async (req, res) => {
    try {
        const { query, type } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!query) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const searchRegex = new RegExp(query, 'i');
        let results = [];

        if (!type || type === 'projects') {
            const projects = await Project.find({
                userId: req.user._id,
                $or: [
                    { name: searchRegex },
                    { description: searchRegex }
                ]
            }).select('name description status createdAt')
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit);
            
            results.push(...projects.map(p => ({ ...p.toObject(), type: 'project' })));
        }

        if (!type || type === 'docs') {
            const docs = await Documentation.find({
                userId: req.user._id,
                title: searchRegex
            }).populate('projectId', 'name')
              .select('title format downloadCount createdAt')
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit);
            
            results.push(...docs.map(d => ({ ...d.toObject(), type: 'documentation' })));
        }

        if (!type || type === 'umls') {
            const umls = await UML.find({
                userId: req.user._id,
                title: searchRegex
            }).populate('projectId', 'name')
              .select('title diagramType createdAt')
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit);
            
            results.push(...umls.map(u => ({ ...u.toObject(), type: 'uml' })));
        }

        // Sort combined results by date
        results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json({
            results: results.slice(0, limit),
            query,
            pagination: {
                current: page,
                hasNext: results.length === limit,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getHistoryItemDetail = async (req, res) => {
    try {
        const { id, type } = req.params;

        let item = null;

        switch (type) {
            case 'chat':
                console.log('Fetching chat history:', id);
                item = await ChatHistory.findOne({ 
                    _id: id, 
                    userId: req.user._id 
                });
                
                if (item) {
                    console.log('Chat found:', {
                        id: item._id,
                        hasCode: !!item.code,
                        codeLength: item.code?.length || 0,
                        hasDoc: !!item.documentation,
                        docLength: item.documentation?.length || 0
                    });
                    
                    const response = {
                        ...item.toObject(),
                        type: 'chat',
                        codeSnippet: {
                            code: item.code,
                            language: item.language
                        },
                        content: item.documentation
                    };
                    
                    console.log('Sending response with codeSnippet:', !!response.codeSnippet);
                    return res.status(200).json(response);
                }
                
                console.log('Chat not found');
                break;
            
            case 'documentation':
                item = await Documentation.findOne({ 
                    _id: id, 
                    userId: req.user._id 
                }).populate('projectId', 'name files');
                
                if (item) {
                    const response = {
                        ...item.toObject(),
                        type: 'documentation'
                    };

                    // If it's from code snippet, return source code
                    if (item.sourceCode && item.sourceLanguage) {
                        response.codeSnippet = {
                            code: item.sourceCode,
                            language: item.sourceLanguage
                        };
                    }
                    // If it's from project, return project files
                    else if (item.projectId && item.projectId.files) {
                        response.codeFiles = item.projectId.files.map(file => ({
                            filename: file.filename || file.originalName,
                            language: file.language,
                            path: file.path,
                            content: file.content
                        }));
                    }
                    
                    return res.status(200).json(response);
                }
                break;
            
            case 'project':
                item = await Project.findOne({ 
                    _id: id, 
                    userId: req.user._id 
                });
                break;
            
            case 'uml':
                item = await UML.findOne({ 
                    _id: id, 
                    userId: req.user._id 
                }).populate('projectId', 'name');
                break;
            
            default:
                return res.status(400).json({ message: 'Invalid type' });
        }

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ ...item.toObject(), type });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};