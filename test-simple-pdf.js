import pdfGeneratorService from './services/pdf-generator.service.js';

const simpleDoc = `# Calculator Documentation

## Overview
This is a simple Java calculator program.

## Functions
- addNumbers: Adds two numbers together

## Code Example
\`\`\`java
public class Calculator {
    public static int addNumbers(int a, int b) {
        return a + b;
    }
}
\`\`\`

## UML Diagram
\`\`\`plantuml
@startuml
class Calculator {
  +addNumbers(int, int) : int
}
@enduml
\`\`\`
`;

async function testSimplePDF() {
    try {
        console.log('🧪 Testing Simple PDF Generation...\n');
        
        const pdfResult = await pdfGeneratorService.generateDocumentationPDF(
            simpleDoc,
            'SimpleCalculator',
            'java'
        );
        
        console.log('✅ PDF generated successfully!');
        console.log(`📄 File: ${pdfResult.fileName}`);
        console.log(`📁 Path: ${pdfResult.filePath}`);
        
        // Check file size
        const fs = await import('fs');
        const stats = fs.default.statSync(pdfResult.filePath);
        console.log(`📊 File size: ${stats.size} bytes`);
        
        console.log('\n🎉 Simple PDF test completed!');
        
    } catch (error) {
        console.error('❌ Simple PDF test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testSimplePDF();