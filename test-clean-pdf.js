import simplePDFService from './services/simple-pdf.service.js';

const cleanDoc = `# Calculator Documentation

## Overview
This is a simple Java calculator program that demonstrates basic arithmetic operations.

## File Information
- Language: JAVA
- Functions: 2
- Classes: 1

## Functions Analysis
### 1. Function: main
Purpose: Entry point of the program - starts execution
Parameters: String[] args

### 2. Function: addNumbers  
Purpose: Performs addition operation on numbers
Parameters: int a, int b
Returns: int sum

## Code Example
public class Calculator {
    public static void main(String[] args) {
        int result = addNumbers(10, 20);
        System.out.println("Result: " + result);
    }
    
    public static int addNumbers(int a, int b) {
        return a + b;
    }
}

## Usage Examples
Calculator calc = new Calculator();
int sum = calc.addNumbers(15, 25);
System.out.println("Sum: " + sum);

## Improvement Suggestions
- Add error handling for invalid inputs
- Include input validation
- Add comprehensive comments
- Implement unit tests
`;

async function testCleanPDF() {
    try {
        console.log('🧪 Testing Clean PDF Generation...\n');
        
        const pdfResult = await simplePDFService.generatePDF(
            cleanDoc,
            'CleanCalculator'
        );
        
        console.log('✅ PDF generated successfully!');
        console.log(`📄 File: ${pdfResult.fileName}`);
        console.log(`📁 Path: ${pdfResult.filePath}`);
        
        console.log('\n🎉 Clean PDF test completed!');
        
    } catch (error) {
        console.error('❌ Clean PDF test failed:', error.message);
    }
}

testCleanPDF();