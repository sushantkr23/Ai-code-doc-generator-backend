import documentationService from '../services/documentation.service.js';
import chatHistoryService from '../services/chat-history.service.js';
import pdfGeneratorService from '../services/pdf-generator.service.js';
import fs from 'fs';
import path from 'path';

export const generateDocumentation = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { format = 'pdf' } = req.body;

        const documentation = await documentationService.generateDocumentation(
            projectId,
            req.user._id,
            format
        );

        res.status(201).json({
            message: 'Documentation generated successfully',
            documentation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserDocumentations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const result = await documentationService.getUserDocumentations(req.user._id, page, limit);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getDocumentationById = async (req, res) => {
    try {
        const { docId } = req.params;
        const documentation = await documentationService.getDocumentationById(docId, req.user._id);
        res.status(200).json(documentation);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const downloadDocumentation = async (req, res) => {
    try {
        const { docId } = req.params;
        console.log('Download request for docId:', docId);
        
        const documentation = await documentationService.getDocumentationById(docId, req.user._id);
        
        if (!documentation) {
            return res.status(404).json({ message: 'Documentation not found' });
        }

        let filePath = documentation.filePath;
        let fileName = `${documentation.title}.pdf`;
        
        // If no PDF file exists or file is missing, generate new PDF
        if (!filePath || !fs.existsSync(filePath)) {
            console.log('PDF file not found, generating new PDF...');
            
            const pdfResult = await pdfGeneratorService.generatePDF(
                documentation.content,
                documentation.title
            );
            
            filePath = pdfResult.filePath;
            fileName = pdfResult.fileName;
            
            // Update documentation with new file path
            documentation.filePath = filePath;
            await documentation.save();
        }

        // Verify file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'PDF file could not be generated' });
        }

        const fileStats = fs.statSync(filePath);
        console.log('Sending PDF file:', fileName, 'Size:', fileStats.size);
        
        // Set proper headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', fileStats.size);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', (streamError) => {
            console.error('File stream error:', streamError);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error reading PDF file' });
            }
        });
        
        fileStream.on('end', () => {
            console.log('PDF download completed successfully');
        });
        
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message || 'Download failed' });
        }
    }
};

export const deleteDocumentation = async (req, res) => {
    try {
        const { docId } = req.params;
        await documentationService.deleteDocumentation(docId, req.user._id);
        res.status(200).json({ message: 'Documentation deleted successfully' });
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

export const regenerateDocumentation = async (req, res) => {
    try {
        const { docId } = req.params;
        const { format = 'pdf' } = req.body;

        // Get existing documentation to find project
        const existingDoc = await documentationService.getDocumentationById(docId, req.user._id);
        
        // Delete old documentation
        await documentationService.deleteDocumentation(docId, req.user._id);
        
        // Generate new documentation
        const newDocumentation = await documentationService.generateDocumentation(
            existingDoc.projectId._id,
            req.user._id,
            format
        );

        res.status(200).json({
            message: 'Documentation regenerated successfully',
            documentation: newDocumentation
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const generateFromCode = async (req, res) => {
    try {
        const { code, language, fileName } = req.body;
        
        if (!code || !language) {
            return res.status(400).json({ message: 'Code and language are required' });
        }

        if (code.length < 10) {
            return res.status(400).json({ message: 'Please provide at least 10 characters of code' });
        }

        console.log('Generating documentation from code snippet...');
        console.log('User logged in:', req.user ? 'Yes' : 'No');
        
        let documentation;
        
        if (req.user && req.user._id) {
            // User is logged in - save to database
            console.log('✅ Generating and saving documentation for logged-in user');
            documentation = await documentationService.generateFromCodeSnippet(
                code,
                language,
                fileName || 'code-snippet',
                req.user._id
            );

            // Save to history
            try {
                await chatHistoryService.saveChat(req.user._id, {
                    code,
                    language,
                    fileName: fileName || 'code-snippet',
                    documentation: documentation.content,
                    generationType: 'code-snippet'
                });
            } catch (historyError) {
                console.warn('Failed to save chat history:', historyError.message);
            }

            res.status(200).json({
                message: 'Documentation generated successfully',
                documentation: {
                    id: documentation._id,
                    title: documentation.title,
                    content: documentation.content,
                    format: documentation.format
                }
            });
        } else {
            // Guest user - generate documentation without saving
            console.log('👥 Generating documentation for guest user (no save)');
            const geminiService = (await import('../services/gemini.service.js')).default;
            const docContent = await geminiService.generateDetailedDocumentation(
                code,
                language,
                fileName || 'code-snippet'
            );
            
            res.status(200).json({
                message: 'Documentation generated successfully (not saved)',
                documentation: {
                    title: `${fileName || 'code-snippet'} Documentation`,
                    content: docContent,
                    format: 'markdown'
                }
            });
        }
    } catch (error) {
        console.error('Code documentation error:', error);
        
        res.status(500).json({ 
            message: error.message || 'Failed to generate documentation',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const generatePDFFromCode = async (req, res) => {
    try {
        console.log('PDF generation request received');
        console.log('User logged in:', req.user ? 'Yes' : 'No');
        const { code, language, fileName, documentation } = req.body;
        
        // Generate documentation if not provided
        let docContent = documentation;
        if (!docContent && code && language) {
            console.log('📝 Generating documentation for PDF...');
            const geminiService = (await import('../services/gemini.service.js')).default;
            docContent = await geminiService.generateDetailedDocumentation(
                code,
                language,
                fileName || 'code-snippet'
            );
        }
        
        if (!docContent || docContent.trim().length === 0) {
            return res.status(400).json({ message: 'Documentation content is required for PDF generation' });
        }

        const docFileName = fileName || 'code-documentation';
        console.log('Generating PDF for:', docFileName);
        
        const pdfResult = await pdfGeneratorService.generatePDF(
            docContent,
            docFileName
        );

        console.log('✅ PDF generated successfully:', pdfResult.fileName);

        // Verify file exists
        if (!fs.existsSync(pdfResult.filePath)) {
            throw new Error('Generated PDF file not found');
        }

        const fileStats = fs.statSync(pdfResult.filePath);
        console.log('PDF size:', (fileStats.size / 1024).toFixed(2), 'KB');
        
        // Set proper headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${pdfResult.fileName}"`);
        res.setHeader('Content-Length', fileStats.size);
        res.setHeader('Cache-Control', 'no-cache');
        
        // Create and pipe file stream
        const fileStream = fs.createReadStream(pdfResult.filePath);
        
        fileStream.on('error', (streamError) => {
            console.error('File stream error:', streamError);
            if (!res.headersSent) {
                res.status(500).json({ message: 'Error reading PDF file' });
            }
        });
        
        fileStream.on('end', () => {
            console.log('✅ PDF file sent successfully');
            // Clean up temporary file after a delay
            setTimeout(() => {
                try {
                    if (fs.existsSync(pdfResult.filePath)) {
                        fs.unlinkSync(pdfResult.filePath);
                        console.log('🗑️ Temporary PDF file cleaned up');
                    }
                } catch (cleanupError) {
                    console.warn('Failed to cleanup PDF file:', cleanupError.message);
                }
            }, 10000); // 10 seconds delay
        });
        
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('PDF generation error:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                message: error.message || 'Failed to generate PDF',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
};