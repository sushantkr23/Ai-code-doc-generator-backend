import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

class SimplePDFService {
    async generatePDF(documentation, fileName) {
        try {
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const codeFont = await pdfDoc.embedFont(StandardFonts.Courier);
            
            let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
            let yPosition = 800;
            const margin = 50;
            const pageWidth = 595.28 - (margin * 2);
            const lineHeight = 16;

            // Clean filename for title
            const cleanFileName = this.cleanText(fileName);
            
            // Title
            page.drawText(`${cleanFileName} - Documentation`, {
                x: margin,
                y: yPosition,
                size: 20,
                font: boldFont,
                color: rgb(0, 0, 0)
            });
            yPosition -= 30;
            
            // Date
            page.drawText(`Generated on: ${new Date().toLocaleDateString()}`, {
                x: margin,
                y: yPosition,
                size: 10,
                font: font,
                color: rgb(0.5, 0.5, 0.5)
            });
            yPosition -= 40;

            // Process content
            const cleanContent = this.cleanText(documentation);
            const lines = cleanContent.split('\n');
            
            for (let line of lines) {
                // Check if we need a new page
                if (yPosition < 80) {
                    page = pdfDoc.addPage([595.28, 841.89]);
                    yPosition = 800;
                }

                line = line.trim();
                if (!line) {
                    yPosition -= lineHeight / 2;
                    continue;
                }

                // Determine line type and formatting
                let currentFont = font;
                let fontSize = 11;
                let color = rgb(0, 0, 0);
                let leftMargin = margin;

                if (line.startsWith('# ')) {
                    // Main header
                    currentFont = boldFont;
                    fontSize = 16;
                    line = line.substring(2);
                    yPosition -= 10; // Extra space before headers
                } else if (line.startsWith('## ')) {
                    // Sub header
                    currentFont = boldFont;
                    fontSize = 14;
                    line = line.substring(3);
                    yPosition -= 5;
                } else if (line.startsWith('### ')) {
                    // Sub-sub header
                    currentFont = boldFont;
                    fontSize = 12;
                    line = line.substring(4);
                } else if (line.startsWith('**') && line.endsWith('**')) {
                    // Bold text
                    currentFont = boldFont;
                    line = line.substring(2, line.length - 2);
                } else if (line.includes('```') || line.startsWith('    ')) {
                    // Code block
                    currentFont = codeFont;
                    fontSize = 10;
                    color = rgb(0.2, 0.2, 0.2);
                    leftMargin = margin + 20;
                    line = line.replace(/```\w*/, '').replace(/```/, '');
                } else if (line.startsWith('- ') || line.startsWith('* ')) {
                    // List item
                    leftMargin = margin + 15;
                    line = '• ' + line.substring(2);
                }

                // Handle long lines by wrapping
                const words = line.split(' ');
                let currentLine = '';
                
                for (const word of words) {
                    const testLine = currentLine + (currentLine ? ' ' : '') + word;
                    const textWidth = this.getTextWidth(testLine, fontSize);
                    
                    if (textWidth > pageWidth - (leftMargin - margin)) {
                        // Draw current line and start new one
                        if (currentLine) {
                            page.drawText(currentLine, {
                                x: leftMargin,
                                y: yPosition,
                                size: fontSize,
                                font: currentFont,
                                color: color
                            });
                            yPosition -= lineHeight;
                            
                            // Check for new page
                            if (yPosition < 80) {
                                page = pdfDoc.addPage([595.28, 841.89]);
                                yPosition = 800;
                            }
                        }
                        currentLine = word;
                    } else {
                        currentLine = testLine;
                    }
                }
                
                // Draw remaining text
                if (currentLine) {
                    page.drawText(currentLine, {
                        x: leftMargin,
                        y: yPosition,
                        size: fontSize,
                        font: currentFont,
                        color: color
                    });
                }
                
                yPosition -= lineHeight;
                
                // Extra space after headers
                if (line.startsWith('#')) {
                    yPosition -= 5;
                }
            }

            const pdfBytes = await pdfDoc.save();
            const pdfFileName = `${cleanFileName}_documentation_${Date.now()}.pdf`;
            const filePath = path.join(process.cwd(), 'uploads', 'docs', pdfFileName);
            
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(filePath, pdfBytes);
            return { filePath, fileName: pdfFileName };
        } catch (error) {
            console.error('PDF generation error:', error);
            throw new Error(`PDF generation failed: ${error.message}`);
        }
    }
    
    // Estimate text width (rough calculation)
    getTextWidth(text, fontSize) {
        return text.length * fontSize * 0.6;
    }

    cleanText(text) {
        if (!text) return '';
        
        return text
            // Remove markdown formatting but keep structure
            .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
            .replace(/\*(.*?)\*/g, '$1')     // Italic
            .replace(/`([^`]+)`/g, '$1')     // Inline code
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
            // Remove all emojis and special characters
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport
            .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
            .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
            .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
            .replace(/[📝📊🔧💡🚀🏢🔄📋⚙️📤🏁📦⚠️🧪🔒⚡📄📈🔗]/g, '') // Specific emojis
            .replace(/&[a-zA-Z0-9#]+;/g, '')        // HTML entities
            .replace(/[^\x00-\x7F]/g, '')           // Remove all non-ASCII characters
            .replace(/\s+/g, ' ')                   // Normalize whitespace
            .trim();
    }
}

export default new SimplePDFService();