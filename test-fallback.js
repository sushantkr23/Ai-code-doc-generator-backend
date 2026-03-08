import geminiService from './services/gemini.service.js';

// Test Java code for adding two numbers
const javaCode = `
public class Calculator {
    private int result;
    
    public static void main(String[] args) {
        Calculator calc = new Calculator();
        int num1 = 10;
        int num2 = 20;
        int sum = calc.addNumbers(num1, num2);
        System.out.println("Sum: " + sum);
        
        // Test with different numbers
        for (int i = 1; i <= 5; i++) {
            int product = calc.multiply(i, 2);
            System.out.println(i + " * 2 = " + product);
        }
    }
    
    public int addNumbers(int a, int b) {
        if (a < 0 || b < 0) {
            System.out.println("Warning: Negative numbers detected");
        }
        result = a + b;
        return result;
    }
    
    public int multiply(int x, int y) {
        return x * y;
    }
    
    public int getLastResult() {
        return result;
    }
}
`;

// Test JavaScript code
const jsCode = `
function addNumbers(a, b) {
    return a + b;
}

const num1 = 10;
const num2 = 20;
const result = addNumbers(num1, num2);
console.log('Result:', result);
`;

async function testFallbackDocumentation() {
    console.log('🧪 Testing Fallback Documentation Generation...\n');
    
    try {
        console.log('1. Testing Java Code Documentation...');
        const javaDoc = await geminiService.generateDetailedDocumentation(javaCode, 'java', 'Calculator.java');
        console.log('✅ Java documentation generated successfully');
        console.log('Preview:', javaDoc.substring(0, 200) + '...\n');
        
        console.log('2. Testing JavaScript Code Documentation...');
        const jsDoc = await geminiService.generateDetailedDocumentation(jsCode, 'javascript', 'calculator.js');
        console.log('✅ JavaScript documentation generated successfully');
        console.log('Preview:', jsDoc.substring(0, 200) + '...\n');
        
        console.log('🎉 All tests passed! Fallback documentation is working.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFallbackDocumentation();