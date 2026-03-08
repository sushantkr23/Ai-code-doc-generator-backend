import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

class PDFGeneratorService {
    async generatePDF(content, fileName) {
        try {
            console.log('Starting PDF generation for:', fileName);
            
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
            
            let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
            let yPosition = 800;
            const margin = 50;
            const lineHeight = 16;
            const pageWidth = 495; // 595 - 2*50 margin
            const pageHeight = 841.89;

            // Clean and prepare content
            const cleanContent = this.cleanAndFormatText(content);
            
            // Title
            const title = `${fileName} - Documentation`;
            page.drawText(title, {
                x: margin,
                y: yPosition,
                size: 20,
                font: boldFont,
                color: rgb(0.1, 0.1, 0.4)
            });
            yPosition -= 35;

            // Date
            page.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
                x: margin,
                y: yPosition,
                size: 10,
                font: italicFont,
                color: rgb(0.4, 0.4, 0.4)
            });
            yPosition -= 50;

            // Process content line by line
            const lines = cleanContent.split('\n');
            
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                
                // Check if we need a new page
                if (yPosition < 80) {
                    page = pdfDoc.addPage([595.28, 841.89]);
                    yPosition = 800;
                }

                // Skip empty lines but add small space
                if (!line.trim()) {
                    yPosition -= lineHeight / 3;
                    continue;
                }

                // Determine formatting based on content
                let currentFont = font;
                let fontSize = 11;
                let textColor = rgb(0, 0, 0);
                let indent = 0;

                // Main heading (# )
                if (line.startsWith('# ')) {
                    currentFont = boldFont;
                    fontSize = 18;
                    textColor = rgb(0.1, 0.1, 0.4);
                    line = line.substring(2);
                    yPosition -= 10;
                } 
                // Sub heading (## )
                else if (line.startsWith('## ')) {
                    currentFont = boldFont;
                    fontSize = 15;
                    textColor = rgb(0.2, 0.2, 0.5);
                    line = line.substring(3);
                    yPosition -= 8;
                } 
                // Sub-sub heading (### )
                else if (line.startsWith('### ')) {
                    currentFont = boldFont;
                    fontSize = 13;
                    textColor = rgb(0.3, 0.3, 0.6);
                    line = line.substring(4);
                    yPosition -= 5;
                }
                // Bold text (**text**)
                else if (line.includes('**')) {
                    currentFont = boldFont;
                    line = line.replace(/\*\*/g, '');
                }
                // Bullet points (- )
                else if (line.trim().startsWith('- ')) {
                    line = '• ' + line.trim().substring(2);
                    indent = 20;
                }
                // Numbered lists (1. )
                else if (/^\d+\.\s/.test(line.trim())) {
                    indent = 20;
                }
                // Code blocks (```)
                else if (line.trim().startsWith('```')) {
                    // Skip code block markers but add spacing
                    yPosition -= lineHeight / 2;
                    continue;
                }
                // Indented content
                else if (line.startsWith('  ')) {
                    indent = 30;
                    fontSize = 10;
                    textColor = rgb(0.2, 0.2, 0.2);
                }

                // Handle long lines with word wrapping
                const maxCharsPerLine = Math.floor((pageWidth - indent) / (fontSize * 0.55));
                const wrappedLines = this.wrapText(line, maxCharsPerLine);
                
                for (const wrappedLine of wrappedLines) {
                    // Check page break for each wrapped line
                    if (yPosition < 80) {
                        page = pdfDoc.addPage([595.28, 841.89]);
                        yPosition = 800;
                    }

                    page.drawText(wrappedLine, {
                        x: margin + indent,
                        y: yPosition,
                        size: fontSize,
                        font: currentFont,
                        color: textColor,
                        maxWidth: pageWidth - indent
                    });
                    
                    yPosition -= lineHeight;
                }
            }

            // Save PDF
            const pdfBytes = await pdfDoc.save();
            const timestamp = Date.now();
            const cleanFileName = this.cleanFileName(fileName);
            const pdfFileName = `${cleanFileName}_${timestamp}.pdf`;
            const uploadsDir = path.join(process.cwd(), 'uploads', 'docs');
            
            // Ensure directory exists
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            
            const filePath = path.join(uploadsDir, pdfFileName);
            fs.writeFileSync(filePath, pdfBytes);
            
            console.log('PDF generated successfully:', filePath);
            console.log('PDF size:', (pdfBytes.length / 1024).toFixed(2), 'KB');
            
            return {
                filePath,
                fileName: pdfFileName,
                size: pdfBytes.length
            };
            
        } catch (error) {
            console.error('PDF generation error:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }

    wrapText(text, maxChars) {
        if (text.length <= maxChars) {
            return [text];
        }

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            
            if (testLine.length <= maxChars) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.length > 0 ? lines : [text];
    }

    cleanAndFormatText(text) {
        if (!text) return 'No content available';
        
        return text
            // Remove code block language identifiers
            .replace(/```\w+/g, '```')
            // Remove inline code backticks but keep content
            .replace(/`([^`]+)`/g, '$1')
            // Remove links but keep text
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            // Clean up multiple spaces
            .replace(/  +/g, ' ')
            // Remove emojis and special characters
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
            .replace(/[\u{2600}-\u{26FF}]/gu, '')
            .replace(/[\u{2700}-\u{27BF}]/gu, '')
            // Remove specific emojis
            .replace(/📄|📊|🎯|📋|🔧|⚙️|🔄|💻|🛠️|⚡|🔒|🧪|📈|🔗|🚀|💡|✅|❌|⚠️|🏛️|🏗️/g, '')
            // Keep only ASCII printable characters and newlines
            .replace(/[^\x20-\x7E\n]/g, '')
            .trim();
    }

    cleanFileName(fileName) {
        return fileName
            .replace(/[^a-zA-Z0-9\-_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase();
    }
}

export default new PDFGeneratorService();