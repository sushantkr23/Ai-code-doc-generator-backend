import pdfGeneratorService from './services/pdf-generator.service.js';

// Test PDF generation
async function testPDF() {
    try {
        console.log('Testing PDF generation...');
        
        const testContent = `# Test Documentation

## Overview
This is a test document to verify PDF generation is working correctly.

## Features
- PDF generation with proper formatting
- Text cleaning and emoji removal
- Line wrapping for long content
- Header formatting with different sizes

## Code Example
\`\`\`javascript
function testFunction() {
    console.log("Hello World");
    return true;
}
\`\`\`

## Conclusion
If you can see this content in a PDF file, the generation is working correctly.`;

        const result = await pdfGeneratorService.generatePDF(testContent, 'test-document');
        console.log('PDF generated successfully:', result);
        console.log('File path:', result.filePath);
        console.log('File size:', result.size, 'bytes');
        
    } catch (error) {
        console.error('PDF generation failed:', error);
    }
}

testPDF();