import Documentation from '../models/documentation.model.js';
import Project from '../models/project.model.js';
import geminiService from './gemini.service.js';
import pdfGeneratorService from './pdf-generator.service.js';
import fs from 'fs';
import path from 'path';

class DocumentationService {
    async generateDocumentation(projectId, userId, format = 'pdf') {
        try {
            const project = await Project.findOne({ _id: projectId, userId });
            if (!project) {
                throw new Error('Project not found');
            }

            await Project.findByIdAndUpdate(projectId, { status: 'processing' });

            let combinedDocumentation = `# ${project.name} Documentation\n\n`;
            combinedDocumentation += `**Generated on:** ${new Date().toLocaleDateString()}\n\n`;
            
            if (project.description) {
                combinedDocumentation += `## Project Description\n${project.description}\n\n`;
            }

            combinedDocumentation += `## Detected Languages\n${project.detectedLanguages.join(', ')}\n\n`;

            for (const file of project.files) {
                try {
                    console.log(`Generating documentation for ${file.originalName}...`);
                    
                    // FIXED: Use the correct method name
                    const fileDoc = await geminiService.generateDetailedDocumentation(
                        file.content,
                        file.language,
                        file.originalName
                    );
                    
                    combinedDocumentation += `\n\n# ${file.originalName}\n\n`;
                    combinedDocumentation += `**Language:** ${file.language.toUpperCase()}\n`;
                    combinedDocumentation += `**File Size:** ${(file.size / 1024).toFixed(2)} KB\n`;
                    combinedDocumentation += `**Lines of Code:** ${file.content.split('\n').length}\n\n`;
                    combinedDocumentation += fileDoc;
                    combinedDocumentation += `\n\n---\n\n`;
                    
                } catch (error) {
                    console.error(`Error generating docs for ${file.originalName}:`, error);
                    combinedDocumentation += `\n\n# ${file.originalName}\n\n`;
                    combinedDocumentation += `**Language:** ${file.language}\n`;
                    combinedDocumentation += `**Error:** Documentation generation failed for this file.\n`;
                    combinedDocumentation += `**Reason:** ${error.message}\n\n---\n\n`;
                }
            }

            // Always generate PDF format
            const pdfPath = await this.generatePDF(combinedDocumentation, project.name);
            
            const documentation = new Documentation({
                projectId,
                userId,
                title: `${project.name} Documentation`,
                content: combinedDocumentation,
                format: 'pdf',
                filePath: pdfPath
            });

            await documentation.save();
            await Project.findByIdAndUpdate(projectId, { status: 'completed' });

            return documentation;
        } catch (error) {
            await Project.findByIdAndUpdate(projectId, { status: 'failed' });
            throw new Error(`Documentation generation failed: ${error.message}`);
        }
    }

    async generatePDF(content, projectName) {
        try {
            console.log('Generating PDF for project:', projectName);
            const result = await pdfGeneratorService.generatePDF(content, projectName);
            return result.filePath;
        } catch (error) {
            console.error('PDF generation error:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }

    async getUserDocumentations(userId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const docs = await Documentation.find({ userId })
                .populate('projectId', 'name description')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-content');

            const total = await Documentation.countDocuments({ userId });
            
            return {
                documentations: docs,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    hasNext: skip + limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            throw new Error(`Failed to fetch documentations: ${error.message}`);
        }
    }

    async getDocumentationById(docId, userId) {
        try {
            const doc = await Documentation.findOne({ _id: docId, userId })
                .populate('projectId', 'name description');
            
            if (!doc) {
                throw new Error('Documentation not found');
            }

            doc.downloadCount += 1;
            await doc.save();

            return doc;
        } catch (error) {
            throw new Error(`Failed to fetch documentation: ${error.message}`);
        }
    }

    async deleteDocumentation(docId, userId) {
        try {
            const doc = await Documentation.findOneAndDelete({ _id: docId, userId });
            if (!doc) {
                throw new Error('Documentation not found');
            }

            if (doc.filePath && fs.existsSync(doc.filePath)) {
                fs.unlinkSync(doc.filePath);
            }

            return doc;
        } catch (error) {
            throw new Error(`Failed to delete documentation: ${error.message}`);
        }
    }

    async generateFromCodeSnippet(code, language, fileName, userId) {
        try {
            console.log('Generating documentation from code snippet:', fileName);
            
            let documentation;
            try {
                // FIXED: Use the correct method name
                documentation = await geminiService.generateDetailedDocumentation(code, language, fileName);
            } catch (geminiError) {
                console.warn('Gemini API failed, using fallback:', geminiError.message);
                documentation = await geminiService.generateEnhancedFallbackDocumentation(code, language, fileName);
            }
            
            const pdfResult = await pdfGeneratorService.generatePDF(documentation, fileName);
            
            const doc = new Documentation({
                userId,
                title: `${fileName} Documentation`,
                content: documentation,
                sourceCode: code,
                sourceLanguage: language,
                format: 'pdf',
                filePath: pdfResult.filePath
            });
            
            await doc.save();
            console.log('Documentation saved with ID:', doc._id);
            return doc;
        } catch (error) {
            console.error('Code snippet documentation error:', error);
            throw new Error(`Code snippet documentation failed: ${error.message}`);
        }
    }

    async downloadDocumentation(docId, userId) {
        try {
            const doc = await this.getDocumentationById(docId, userId);
            
            if (doc.format === 'pdf' && doc.filePath && fs.existsSync(doc.filePath)) {
                return {
                    filePath: doc.filePath,
                    fileName: `${doc.title}.pdf`,
                    contentType: 'application/pdf'
                };
            } else {
                const pdfPath = await this.generatePDF(doc.content, doc.title);
                
                doc.filePath = pdfPath;
                doc.format = 'pdf';
                await doc.save();
                
                return {
                    filePath: pdfPath,
                    fileName: `${doc.title}.pdf`,
                    contentType: 'application/pdf'
                };
            }
        } catch (error) {
            throw new Error(`Failed to download documentation: ${error.message}`);
        }
    }
}

export default new DocumentationService();