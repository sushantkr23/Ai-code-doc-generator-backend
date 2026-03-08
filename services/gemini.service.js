import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env in this file too
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
class GeminiService {
    constructor() {
        console.log('🔧 Initializing Gemini Service...');
        
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (apiKey && apiKey.trim() !== '') {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ 
                model: 'gemini-2.5-flash',
                generationConfig: {
                    maxOutputTokens: 4096,
                    temperature: 0.5,
                }
            });
            this.useGeminiAPI = true;
            console.log('✅ Gemini API enabled with gemini-2.5-flash');
        } else {
            this.useGeminiAPI = false;
            console.log('⚠️ GEMINI_API_KEY not found - using fallback documentation');
        }
    }

    async generateDocumentation(codeContent, language, filename) {
        if (!this.useGeminiAPI) {
            console.log('Using enhanced fallback documentation');
            return this.generateEnhancedFallbackDocumentation(codeContent, language, filename);
        }

        try {
            console.log('🤖 Using Gemini API for documentation generation...');
            const prompt = this.createComprehensivePrompt(codeContent, language, filename);
            
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const documentation = response.text();
            
            if (documentation && documentation.length > 300) {
                console.log('✅ Gemini API documentation generated successfully');
                return documentation;
            } else {
                console.log('⚠️ Gemini response too short, using fallback');
                return this.generateEnhancedFallbackDocumentation(codeContent, language, filename);
            }
        } catch (error) {
            console.error('❌ Gemini API error:', error.message);
            console.log('🔄 Falling back to enhanced documentation');
            return this.generateEnhancedFallbackDocumentation(codeContent, language, filename);
        }
    }

    createComprehensivePrompt(codeContent, language, filename) {
        return `You are an expert code documentation writer. Analyze this ${language} code and create clear, educational documentation.

CODE:
\`\`\`${language}
${codeContent}
\`\`\`

Create documentation in this structure:

# ${filename} - Code Documentation

## 📋 Overview
Explain what this code does and its main purpose in 2-3 clear sentences.

## 🔑 Key Components

### Variables
List each variable with:
- **Name**: variable name
- **Type**: data type
- **Purpose**: what it stores and why

### Functions/Methods
For each function explain:
- **Name**: function name
- **Parameters**: what inputs it takes
- **Returns**: what it gives back
- **Purpose**: what it does

## 📖 Code Explanation

Go through the code and explain:
1. What happens first (initialization, setup)
2. Main logic flow (step by step)
3. How it processes data
4. What the output/result is

For important lines, explain WHY they work that way, not just WHAT they do.

## 💻 How to Use

### Requirements
What's needed to run this code.

### Running the Code
Step-by-step instructions.

### Example
Show one practical example with:
- Input
- What happens
- Output

## ⚡ Key Points
Mention 3-4 important things to remember about this code.

Be clear and educational. Explain concepts so someone learning can understand.`;
    }

    formatDocumentationForPDF(doc, language, filename) {
        // Basic formatting
        let formatted = doc
            .replace(/\n# /g, '\n\n# ')
            .replace(/\n## /g, '\n\n## ')
            .replace(/\n### /g, '\n\n### ')
            .replace(/\n#### /g, '\n\n#### ');
        
        // Ensure code blocks are properly formatted
        formatted = formatted.replace(/```(\w+)?\n/g, '```$1\n');
        formatted = formatted.replace(/\n```/g, '\n```\n');
        
        // Add page breaks for PDF
        const sections = [
            '# COMPLETE CODE DOCUMENTATION',
            '## 1. 🎯 OVERVIEW: What This Code Does',
            '## 2. 📚 KEY CONCEPTS EXPLAINED',
            '## 3. 🔍 COMPLETE CODE WALKTHROUGH',
            '## 4. 🚀 HOW TO USE THIS CODE',
            '## 5. 💡 PRACTICAL EXAMPLES',
            '## 6. ⚠️ COMMON ERRORS & SOLUTIONS',
            '## 7. ⚡ PERFORMANCE ANALYSIS',
            '## 8. 🔧 HOW TO EXTEND & IMPROVE',
            '## 9. 📖 LEARNING OUTCOMES'
        ];
        
        sections.forEach(section => {
            if (formatted.includes(section)) {
                formatted = formatted.replace(
                    new RegExp(`\\n${section}`, 'g'),
                    `\n\\pagebreak\n${section}`
                );
            }
        });
        
        return formatted;
    }

    async generateDetailedDocumentation(codeContent, language, filename) {
        console.log(`📝 Generating documentation for: ${filename} (${language})`);
        console.log(`Code length: ${codeContent.length} characters`);
        
        try {
            const documentation = await this.generateDocumentation(codeContent, language, filename);
            
            // Ensure we have sufficient documentation
            if (documentation && documentation.length > 1500) {
                console.log(`✅ Documentation generated: ${documentation.length} characters`);
                return documentation;
            } else {
                console.log('⚠️ Documentation too short, using enhanced fallback');
                return this.generateEnhancedFallbackDocumentation(codeContent, language, filename);
            }
        } catch (error) {
            console.error('❌ Error generating documentation:', error.message);
            return this.generateEnhancedFallbackDocumentation(codeContent, language, filename);
        }
    }

    generateEnhancedFallbackDocumentation(codeContent, language, filename) {
        console.log(`🔄 Creating enhanced fallback documentation for ${filename}`);
        
        const lines = codeContent.split('\n').filter(line => line.trim());
        const functions = this.extractFunctions(codeContent, language);
        const variables = this.extractVariables(codeContent, language);
        const classes = this.extractClasses(codeContent, language);
        const imports = this.extractImports(codeContent, language);
        const complexity = this.analyzeComplexity(codeContent);
        
        // Generate comprehensive documentation
        let documentation = `# ${filename} - COMPLETE CODE DOCUMENTATION\n\n`;
        
        documentation += this.generateLanguageSpecificHeader(language, filename);
        documentation += this.generateExecutiveSummary(codeContent, language, functions, variables, classes, complexity);
        documentation += this.generateCodeAnalysis(codeContent, language, functions, variables, classes, imports);
        documentation += this.generateDetailedCodeExplanation(codeContent, language, functions, classes);
        documentation += this.generateUsageGuide(language, filename, imports);
        documentation += this.generatePracticalExamples(codeContent, language, functions, classes);
        documentation += this.generateCommonProblemsAndSolutions(language);
        documentation += this.generateFooter();
        
        return documentation;
    }

    generateLanguageSpecificHeader(language, filename) {
        const languageInfo = {
            'javascript': {
                name: 'JavaScript',
                runtime: 'Node.js or Browser',
                extension: '.js',
                icon: '🟨'
            },
            'python': {
                name: 'Python',
                runtime: 'Python 3.x',
                extension: '.py',
                icon: '🐍'
            },
            'java': {
                name: 'Java',
                runtime: 'JVM (Java Virtual Machine)',
                extension: '.java',
                icon: '☕'
            },
            'cpp': {
                name: 'C++',
                runtime: 'Compiled (g++/clang++)',
                extension: '.cpp',
                icon: '⚙️'
            },
            'c': {
                name: 'C',
                runtime: 'Compiled (gcc/clang)',
                extension: '.c',
                icon: '🔧'
            },
            'csharp': {
                name: 'C#',
                runtime: '.NET Framework/Core',
                extension: '.cs',
                icon: '🔷'
            },
            'php': {
                name: 'PHP',
                runtime: 'PHP Server',
                extension: '.php',
                icon: '🐘'
            },
            'ruby': {
                name: 'Ruby',
                runtime: 'Ruby Interpreter',
                extension: '.rb',
                icon: '💎'
            },
            'go': {
                name: 'Go',
                runtime: 'Go Compiler',
                extension: '.go',
                icon: '🚀'
            },
            'rust': {
                name: 'Rust',
                runtime: 'Rust Compiler',
                extension: '.rs',
                icon: '🦀'
            },
            'swift': {
                name: 'Swift',
                runtime: 'Swift/SwiftUI',
                extension: '.swift',
                icon: '🐦'
            },
            'kotlin': {
                name: 'Kotlin',
                runtime: 'JVM or Native',
                extension: '.kt',
                icon: '⚡'
            },
            'typescript': {
                name: 'TypeScript',
                runtime: 'tsc (TypeScript Compiler)',
                extension: '.ts',
                icon: '📘'
            }
        };
        
        const info = languageInfo[language] || { 
            name: language.toUpperCase(), 
            runtime: 'Language-specific runtime',
            icon: '📄'
        };
        
        return `
        ${info.icon} **LANGUAGE**: ${info.name}
        **FILE**: ${filename}
        **RUNTIME**: ${info.runtime}
        **GENERATED**: ${new Date().toLocaleDateString()}
        
        ---
        
        `;
    }

    generateExecutiveSummary(code, language, functions, variables, classes, complexity) {
        let summary = `## 📋 EXECUTIVE SUMMARY\n\n`;
        
        // Detect program type
        const codeLower = code.toLowerCase();
        let programType = 'General Program';
        let description = '';
        
        if (codeLower.includes('prime') || code.includes('isprime')) {
            programType = 'Prime Number Checker';
            description = `This ${language} program checks whether a given number is prime or not. 
            A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.`;
        } 
        else if (codeLower.includes('sort') || codeLower.includes('bubble') || codeLower.includes('quick') || codeLower.includes('merge')) {
            programType = 'Sorting Algorithm';
            description = `This ${language} program sorts a collection of elements in ascending or descending order.`;
        }
        else if (codeLower.includes('calculator') || codeLower.includes('add') || codeLower.includes('subtract') || 
                 codeLower.includes('multiply') || codeLower.includes('divide')) {
            programType = 'Calculator Program';
            description = `This ${language} program performs mathematical calculations and arithmetic operations.`;
        }
        else if (codeLower.includes('fibonacci') || codeLower.includes('fib')) {
            programType = 'Fibonacci Sequence Generator';
            description = `This ${language} program generates Fibonacci numbers - a sequence where each number is the sum of the two preceding ones.`;
        }
        else if (codeLower.includes('factorial') || codeLower.includes('fact')) {
            programType = 'Factorial Calculator';
            description = `This ${language} program calculates the factorial of a number (n! = n × (n-1) × ... × 1).`;
        }
        else if (classes.length > 0) {
            programType = 'Object-Oriented Program';
            description = `This ${language} program uses object-oriented programming principles with ${classes.length} class(es). 
            It demonstrates encapsulation, organization, and reusability.`;
        }
        else if (functions.length > 0) {
            programType = 'Functional Program';
            description = `This ${language} program is organized into ${functions.length} function(s). 
            Each function has a specific responsibility, making the code modular and maintainable.`;
        }
        else {
            programType = `${language.toUpperCase()} Program`;
            description = `This program performs specific operations in ${language}. 
            Study the detailed breakdown below to understand its functionality completely.`;
        }
        
        summary += `### Program Type: ${programType}\n\n`;
        summary += `${description}\n\n`;
        
        // Add statistics
        summary += `### 📊 Program Statistics\n\n`;
        summary += `| Metric | Value |\n`;
        summary += `|--------|-------|\n`;
        summary += `| **Total Lines** | ${code.split('\n').length} |\n`;
        summary += `| **Functions/Methods** | ${functions.length} |\n`;
        summary += `| **Classes** | ${classes.length} |\n`;
        summary += `| **Variables** | ${variables.length} |\n`;
        summary += `| **Complexity Level** | ${complexity.level} |\n`;
        summary += `| **Language** | ${language.toUpperCase()} |\n`;
        summary += `| **Generated** | ${new Date().toLocaleDateString()} |\n\n`;
        
        return summary;
    }

    generateCodeAnalysis(code, language, functions, variables, classes, imports) {
        let analysis = `## 🔍 CODE STRUCTURE ANALYSIS\n\n`;
        
        // 1. Dependencies
        if (imports.length > 0) {
            analysis += `### 📦 Dependencies & Imports\n\n`;
            imports.forEach(imp => {
                analysis += `- **${imp}**\n`;
                analysis += `  *Purpose*: ${this.getImportPurpose(imp, language)}\n`;
            });
            analysis += `\n`;
        }
        
        // 2. Classes
        if (classes.length > 0) {
            analysis += `### 🏛️ Classes\n\n`;
            classes.forEach(cls => {
                analysis += `#### Class: \`${cls.name}\`\n`;
                analysis += `- **Purpose**: ${cls.purpose}\n`;
                analysis += `- **Type**: ${this.detectClassType(cls.name, code)}\n`;
                if (cls.methods && cls.methods.length > 0) {
                    analysis += `- **Methods**: ${cls.methods.slice(0, 5).join(', ')}`;
                    if (cls.methods.length > 5) analysis += `, and ${cls.methods.length - 5} more`;
                    analysis += `\n`;
                }
                analysis += `\n`;
            });
        }
        
        // 3. Functions
        if (functions.length > 0) {
            analysis += `### 🔧 Functions & Methods\n\n`;
            analysis += `| Function | Parameters | Returns | Purpose |\n`;
            analysis += `|----------|------------|---------|---------|\n`;
            
            functions.forEach(func => {
                const params = func.params.length > 0 ? func.params.join(', ') : 'None';
                const returns = func.returnType || 'void';
                const purpose = func.purpose.length > 50 ? func.purpose.substring(0, 50) + '...' : func.purpose;
                
                analysis += `| \`${func.name}()\` | ${params} | ${returns} | ${purpose} |\n`;
            });
            analysis += `\n`;
        }
        
        // 4. Variables
        if (variables.length > 0) {
            analysis += `### 💾 Key Variables\n\n`;
            analysis += `| Variable | Type | Purpose |\n`;
            analysis += `|----------|------|---------|\n`;
            
            variables.slice(0, 10).forEach(variable => {
                const purpose = this.getVariablePurpose(variable.name, variable.type);
                analysis += `| \`${variable.name}\` | ${variable.type} | ${purpose} |\n`;
            });
            
            if (variables.length > 10) {
                analysis += `| ... | ... | ... and ${variables.length - 10} more variables |\n`;
            }
            analysis += `\n`;
        }
        
        return analysis;
    }

    generateDetailedCodeExplanation(code, language, functions, classes) {
        let explanation = `## 📖 DETAILED CODE EXPLANATION\n\n`;
        
        // Split code into lines for line-by-line explanation
        const lines = code.split('\n');
        const importantLines = [];
        
        // Find important lines (not empty, not just comments)
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('//') && !trimmedLine.startsWith('#')) {
                importantLines.push({ line: trimmedLine, number: index + 1 });
            }
        });
        
        // Take first 15 important lines for detailed explanation
        if (importantLines.length > 0) {
            explanation += `### Line-by-Line Breakdown\n\n`;
            
            importantLines.slice(0, 15).forEach(item => {
                explanation += `**Line ${item.number}**: \`${item.line}\`\n`;
                explanation += `${this.explainLine(item.line, language)}\n\n`;
            });
            
            if (importantLines.length > 15) {
                explanation += `*... and ${importantLines.length - 15} more lines of code*\n\n`;
            }
        }
        
        // Explain key concepts found in code
        explanation += `### 🔑 Key Programming Concepts Used\n\n`;
        
        if (code.includes('import ') || code.includes('include ') || code.includes('require(')) {
            explanation += `#### 1. Modular Programming\n`;
            explanation += `- Code is organized into separate modules/files\n`;
            explanation += `- Uses imports/includes to reuse functionality\n`;
            explanation += `- Promotes code reusability and organization\n\n`;
        }
        
        if (code.includes('class ') || code.includes('interface ')) {
            explanation += `#### 2. Object-Oriented Programming\n`;
            explanation += `- Uses classes and objects\n`;
            explanation += `- Encapsulates data and behavior\n`;
            explanation += `- Promotes code organization and reuse\n\n`;
        }
        
        if (code.includes('for ') || code.includes('while ') || code.includes('do ')) {
            explanation += `#### 3. Loops & Iteration\n`;
            explanation += `- Repeats operations multiple times\n`;
            explanation += `- Processes collections of data\n`;
            explanation += `- Automates repetitive tasks\n\n`;
        }
        
        if (code.includes('if ') || code.includes('else ') || code.includes('switch ')) {
            explanation += `#### 4. Conditional Logic\n`;
            explanation += `- Makes decisions based on conditions\n`;
            explanation += `- Controls program flow\n`;
            explanation += `- Handles different scenarios\n\n`;
        }
        
        if (code.includes('try ') || code.includes('catch ') || code.includes('throw ')) {
            explanation += `#### 5. Error Handling\n`;
            explanation += `- Gracefully handles errors\n`;
            explanation += `- Prevents program crashes\n`;
            explanation += `- Provides useful error messages\n\n`;
        }
        
        // Function explanations
        if (functions.length > 0) {
            explanation += `### 🔨 Function Details\n\n`;
            
            functions.slice(0, 5).forEach(func => {
                explanation += `#### Function: \`${func.name}()\`\n\n`;
                explanation += `**Purpose**: ${func.purpose}\n\n`;
                
                if (func.params.length > 0) {
                    explanation += `**Parameters**:\n`;
                    func.params.forEach((param, index) => {
                        explanation += `${index + 1}. \`${param}\` - ${this.explainParameter(param, func.name, language)}\n`;
                    });
                    explanation += `\n`;
                }
                
                explanation += `**How it works**:\n`;
                explanation += `${this.describeFunctionWorkflow(func, code, language)}\n\n`;
            });
        }
        
        return explanation;
    }

    generateUsageGuide(language, filename, imports) {
        let guide = `## 🚀 HOW TO USE THIS CODE\n\n`;
        
        const compileCommands = {
            'java': `javac ${filename}`,
            'python': `python ${filename}`,
            'javascript': `node ${filename}`,
            'cpp': `g++ ${filename} -o program && ./program`,
            'c': `gcc ${filename} -o program && ./program`,
            'csharp': `dotnet run ${filename}`,
            'go': `go run ${filename}`,
            'rust': `rustc ${filename} && ./${filename.replace('.rs', '')}`,
            'php': `php ${filename}`,
            'ruby': `ruby ${filename}`,
            'swift': `swift ${filename}`,
            'kotlin': `kotlinc ${filename} -include-runtime -d program.jar && java -jar program.jar`
        };
        
        const runCommands = {
            'java': `java ${filename.replace('.java', '')}`,
            'python': `python ${filename}`,
            'javascript': `node ${filename}`,
            'cpp': `./program`,
            'c': `./program`,
            'csharp': `dotnet run`,
            'go': `go run ${filename}`,
            'rust': `./${filename.replace('.rs', '')}`,
            'php': `php ${filename}`,
            'ruby': `ruby ${filename}`,
            'swift': `./${filename.replace('.swift', '')}`,
            'kotlin': `java -jar program.jar`
        };
        
        const compileCmd = compileCommands[language] || `[Compile command for ${language}]`;
        const runCmd = runCommands[language] || `[Run command for ${language}]`;
        
        guide += `### 📋 Prerequisites\n\n`;
        guide += `1. **${language.toUpperCase()} Environment**: Install the necessary compiler/interpreter\n`;
        
        if (imports.length > 0) {
            guide += `2. **Dependencies**: Install required packages:\n`;
            imports.forEach(imp => {
                guide += `   - ${imp}\n`;
            });
        }
        
        guide += `\n### ⚙️ Step-by-Step Setup\n\n`;
        guide += `1. **Save the code** as \`${filename}\`\n`;
        guide += `2. **Open terminal/command prompt** in the file directory\n`;
        
        if (['java', 'cpp', 'c', 'csharp', 'go', 'rust', 'kotlin'].includes(language)) {
            guide += `3. **Compile the code**:\n`;
            guide += `   \`\`\`bash\n`;
            guide += `   ${compileCmd}\n`;
            guide += `   \`\`\`\n`;
        }
        
        guide += `4. **Run the program**:\n`;
        guide += `   \`\`\`bash\n`;
        guide += `   ${runCmd}\n`;
        guide += `   \`\`\`\n\n`;
        
        guide += `### 💻 Expected Program Flow\n\n`;
        guide += `1. Program starts execution\n`;
        guide += `2. May prompt for input (if interactive)\n`;
        guide += `3. Processes the input/data\n`;
        guide += `4. Displays results/output\n`;
        guide += `5. Program ends\n\n`;
        
        guide += `### 🔧 Testing the Code\n\n`;
        guide += `1. **Basic Test**: Run with simple inputs\n`;
        guide += `2. **Edge Cases**: Test with boundary values\n`;
        guide += `3. **Error Cases**: Test with invalid inputs\n`;
        guide += `4. **Performance**: Test with large inputs (if applicable)\n`;
        
        return guide;
    }

    generatePracticalExamples(code, language, functions, classes) {
        let examples = `## 💡 PRACTICAL EXAMPLES\n\n`;
        
        // Detect what type of examples to generate
        if (code.includes('prime') || code.includes('isPrime')) {
            examples += this.generatePrimeNumberExamples(language);
        } 
        else if (code.includes('sort') || code.includes('Sort')) {
            examples += this.generateSortingExamples(language);
        }
        else if (code.includes('calculator') || code.includes('calculate')) {
            examples += this.generateCalculatorExamples(language);
        }
        else if (code.includes('fibonacci') || code.includes('fib')) {
            examples += this.generateFibonacciExamples(language);
        }
        else if (code.includes('factorial') || code.includes('fact')) {
            examples += this.generateFactorialExamples(language);
        }
        else {
            examples += this.generateGeneralExamples(language, functions);
        }
        
        // Add common examples for any program
        examples += `\n### 📝 Sample Program Outputs\n\n`;
        
        examples += `**Example Run 1**:\n`;
        examples += `\`\`\`\n`;
        examples += `$ ${this.getRunCommand(language, 'program')}\n`;
        examples += `Enter a number: 42\n`;
        examples += `Processing...\n`;
        examples += `Result: [Output based on program logic]\n`;
        examples += `\`\`\`\n\n`;
        
        examples += `**Example Run 2**:\n`;
        examples += `\`\`\`\n`;
        examples += `$ ${this.getRunCommand(language, 'program')}\n`;
        examples += `Enter input: test\n`;
        examples += `Processing...\n`;
        examples += `Result: [Another output example]\n`;
        examples += `\`\`\`\n\n`;
        
        examples += `**Example Run 3 (Error Case)**:\n`;
        examples += `\`\`\`\n`;
        examples += `$ ${this.getRunCommand(language, 'program')}\n`;
        examples += `Enter input: -5\n`;
        examples += `Error: Invalid input! Please enter a positive number.\n`;
        examples += `\`\`\`\n`;
        
        return examples;
    }

    generatePrimeNumberExamples(language) {
        let examples = `### 🔢 Prime Number Examples\n\n`;
        
        examples += `**What is a Prime Number?**\n`;
        examples += `A prime number is a natural number greater than 1 that cannot be formed by multiplying two smaller natural numbers.\n\n`;
        
        examples += `**Example 1: Checking 7**\n`;
        examples += `\`\`\`\n`;
        examples += `Is 7 a prime number?\n`;
        examples += `✓ 7 is only divisible by 1 and 7\n`;
        examples += `✓ 7 % 2 = 1 (not divisible)\n`;
        examples += `✓ 7 % 3 = 1 (not divisible)\n`;
        examples += `✓ ... checking up to 3 (7/2 = 3.5)\n`;
        examples += `✅ Result: 7 IS a prime number\n`;
        examples += `\`\`\`\n\n`;
        
        examples += `**Example 2: Checking 9**\n`;
        examples += `\`\`\`\n`;
        examples += `Is 9 a prime number?\n`;
        examples += `✓ 9 % 2 = 1 (not divisible)\n`;
        examples += `✓ 9 % 3 = 0 ← DIVISIBLE!\n`;
        examples += `✅ Result: 9 is NOT a prime number\n`;
        examples += `\`\`\`\n\n`;
        
        examples += `**Example 3: Special Cases**\n`;
        examples += `\`\`\`\n`;
        examples += `1: Not prime (definition requires >1)\n`;
        examples += `2: Prime (only even prime number)\n`;
        examples += `0: Not prime\n`;
        examples += `Negative numbers: Not prime\n`;
        examples += `\`\`\`\n\n`;
        
        return examples;
    }

    generateGeneralExamples(language, functions) {
        let examples = `### 📊 General Usage Examples\n\n`;
        
        if (functions.length > 0) {
            const mainFunc = functions[0];
            
            examples += `**Using the \`${mainFunc.name}()\` function**:\n`;
            examples += `\`\`\`${language}\n`;
            examples += `// Example 1: Basic function call\n`;
            
            if (language === 'java') {
                examples += `public class Example {\n`;
                examples += `    public static void main(String[] args) {\n`;
                examples += `        ${mainFunc.returnType !== 'void' ? `${mainFunc.returnType || 'Object'} result = ` : ''}${mainFunc.name}(${this.generateSampleParameters(mainFunc)});\n`;
                if (mainFunc.returnType !== 'void') {
                    examples += `        System.out.println("Result: " + result);\n`;
                }
                examples += `    }\n`;
                examples += `}\n`;
            } else if (language === 'python') {
                examples += `# Call the function\n`;
                examples += `${mainFunc.returnType !== 'None' ? 'result = ' : ''}${mainFunc.name}(${this.generateSampleParameters(mainFunc)})\n`;
                if (mainFunc.returnType !== 'None') {
                    examples += `print(f"Result: {result}")\n`;
                }
            } else if (language === 'javascript') {
                examples += `// Call the function\n`;
                examples += `${mainFunc.returnType !== 'void' ? 'const result = ' : ''}${mainFunc.name}(${this.generateSampleParameters(mainFunc)});\n`;
                if (mainFunc.returnType !== 'void') {
                    examples += `console.log('Result:', result);\n`;
                }
            }
            
            examples += `\`\`\`\n\n`;
        }
        
        examples += `**Complete Program Example**:\n`;
        examples += `\`\`\`${language}\n`;
        examples += this.generateCompleteExample(language);
        examples += `\`\`\`\n`;
        
        return examples;
    }

    generateCommonProblemsAndSolutions(language) {
        let problems = `## ⚠️ COMMON PROBLEMS & SOLUTIONS\n\n`;
        
        problems += `### ❌ Common Errors\n\n`;
        
        const commonErrors = {
            'java': [
                {
                    error: 'Scanner cannot be resolved',
                    cause: 'Missing import statement',
                    solution: 'Add `import java.util.Scanner;` at the top of the file'
                },
                {
                    error: 'Could not find or load main class',
                    cause: 'Class name doesn\'t match filename or compilation issue',
                    solution: '1. Ensure class name matches filename\n2. Compile with `javac FileName.java`\n3. Run with `java ClassName` (without .java)'
                },
                {
                    error: 'InputMismatchException',
                    cause: 'Entering wrong data type (e.g., text when number expected)',
                    solution: 'Enter the correct data type or add input validation'
                }
            ],
            'python': [
                {
                    error: 'IndentationError',
                    cause: 'Inconsistent indentation (mixing tabs and spaces)',
                    solution: 'Use consistent 4-space indentation throughout the code'
                },
                {
                    error: 'NameError: name is not defined',
                    cause: 'Using variable before declaration',
                    solution: 'Define variables before using them'
                },
                {
                    error: 'TypeError',
                    cause: 'Wrong data type operations',
                    solution: 'Convert types appropriately using int(), str(), etc.'
                }
            ],
            'javascript': [
                {
                    error: 'ReferenceError: variable is not defined',
                    cause: 'Using undeclared variable',
                    solution: 'Declare variables with let, const, or var'
                },
                {
                    error: 'TypeError: Cannot read property',
                    cause: 'Accessing property of undefined/null',
                    solution: 'Check if object exists before accessing properties'
                },
                {
                    error: 'NaN (Not a Number)',
                    cause: 'Invalid mathematical operation',
                    solution: 'Validate input before calculations'
                }
            ]
        };
        
        const errors = commonErrors[language] || [
            {
                error: 'Syntax Error',
                cause: 'Typos or incorrect language syntax',
                solution: 'Check for missing brackets, semicolons, or quotes'
            },
            {
                error: 'Runtime Error',
                cause: 'Error during execution (division by zero, etc.)',
                solution: 'Add error handling and input validation'
            },
            {
                error: 'Logic Error',
                cause: 'Program runs but gives wrong results',
                solution: 'Debug step-by-step, check conditions and calculations'
            }
        ];
        
        errors.forEach((err, index) => {
            problems += `#### Problem ${index + 1}: ${err.error}\n\n`;
            problems += `**Why it happens**: ${err.cause}\n\n`;
            problems += `**How to fix**:\n${err.solution}\n\n`;
        });
        
        problems += `### 🔧 Debugging Tips\n\n`;
        problems += `1. **Add print/debug statements** to see variable values at different points\n`;
        problems += `2. **Test with simple inputs** first before trying complex cases\n`;
        problems += `3. **Check error messages carefully** - they often tell you exactly what's wrong\n`;
        problems += `4. **Use a debugger** if available for your language/IDE\n`;
        problems += `5. **Break the problem down** - test small parts individually\n`;
        problems += `6. **Search online** - someone has probably had the same issue\n\n`;
        
        problems += `### 🛡️ Preventive Measures\n\n`;
        problems += `1. **Always validate user input**\n`;
        problems += `2. **Add error handling (try-catch)** for operations that can fail\n`;
        problems += `3. **Write comments** to explain complex logic\n`;
        problems += `4. **Test edge cases** (empty input, very large numbers, negative values)\n`;
        problems += `5. **Keep code simple** - complexity increases chances of errors\n`;
        
        return problems;
    }

    generateFooter() {
        return `
        ## 📈 HOW TO EXTEND & IMPROVE
        
        ### 🚀 Possible Enhancements
        
        1. **Add Input Validation**
           - Check for invalid inputs
           - Provide helpful error messages
           - Handle edge cases gracefully
        
        2. **Improve User Experience**
           - Add a menu system
           - Make output more user-friendly
           - Add progress indicators
        
        3. **Enhance Functionality**
           - Add more features
           - Support more data types
           - Handle larger datasets
        
        4. **Optimize Performance**
           - Use more efficient algorithms
           - Reduce memory usage
           - Implement caching
        
        5. **Add Testing**
           - Write unit tests
           - Add integration tests
           - Create test cases for all scenarios
        
        ### 📚 Learning Path
        
        After understanding this code, you can:
        
        1. **Modify it** to add new features
        2. **Rewrite it** in another language
        3. **Combine it** with other programs
        4. **Use it as a reference** for similar projects
        5. **Share it** with others learning programming
        
        ### 🎯 Best Practices Implemented
        
        This code demonstrates:
        - Clear variable naming
        - Proper code organization
        - Basic error prevention
        - Readable structure
        - Modular design (where applicable)
        
        ---
        
        ## 🏁 CONCLUSION
        
        This documentation provides a complete understanding of the code. 
        
        **Next Steps:**
        1. Run the code and see it working
        2. Modify it to understand how changes affect behavior
        3. Add your own features
        4. Use the concepts learned in your own projects
        
        **Remember**: The best way to learn programming is by doing. 
        Experiment, make mistakes, and learn from them.
        
        ---
        
        *Comprehensive Documentation Generated*
        *Date: ${new Date().toLocaleDateString()}*
        *For educational and learning purposes*
        
        **Happy Coding! 💻**
        `;
    }

    // Helper Methods
    getImportPurpose(importName, language) {
        const importPurposes = {
            'java': {
                'java.util.Scanner': 'Reads user input from keyboard',
                'java.util.*': 'Utility classes (collections, date, random, etc.)',
                'java.io.*': 'File and stream operations',
                'java.math.*': 'Mathematical operations',
                'java.net.*': 'Networking operations',
                'java.awt.*': 'GUI components',
                'javax.swing.*': 'Advanced GUI components'
            },
            'python': {
                'math': 'Mathematical functions (sqrt, sin, cos, etc.)',
                'sys': 'System-specific parameters and functions',
                'os': 'Operating system interfaces',
                'datetime': 'Date and time operations',
                'json': 'JSON encoding and decoding',
                'random': 'Generate random numbers',
                're': 'Regular expression operations'
            },
            'javascript': {
                'fs': 'File system operations (Node.js)',
                'http': 'HTTP server and client',
                'path': 'File and directory path operations',
                'express': 'Web application framework',
                'mongoose': 'MongoDB object modeling',
                'axios': 'HTTP client for making requests',
                'lodash': 'Utility library for common tasks'
            },
            'cpp': {
                'iostream': 'Input/output stream operations',
                'vector': 'Dynamic array implementation',
                'string': 'String operations',
                'algorithm': 'Common algorithms (sort, search, etc.)',
                'cmath': 'Mathematical functions'
            }
        };
        
        if (importPurposes[language] && importPurposes[language][importName]) {
            return importPurposes[language][importName];
        }
        
        // Try to match partial import names
        for (const [key, purpose] of Object.entries(importPurposes[language] || {})) {
            if (importName.includes(key.split('.')[0])) {
                return purpose;
            }
        }
        
        return 'External library or module for additional functionality';
    }

    getRunCommand(language, filename) {
        const commands = {
            'java': `java ${filename.replace('.java', '')}`,
            'python': `python ${filename}`,
            'javascript': `node ${filename}`,
            'cpp': `./${filename.replace('.cpp', '')}`,
            'c': `./${filename.replace('.c', '')}`,
            'csharp': `dotnet run`,
            'go': `go run ${filename}`,
            'rust': `./${filename.replace('.rs', '')}`,
            'php': `php ${filename}`,
            'ruby': `ruby ${filename}`,
            'swift': `./${filename.replace('.swift', '')}`,
            'kotlin': `java -jar ${filename.replace('.kt', '.jar')}`
        };
        
        return commands[language] || `run ${filename}`;
    }

    explainLine(line, language) {
        const lineLower = line.toLowerCase();
        
        if (line.includes('import ') || line.includes('include ') || line.includes('require(')) {
            return 'Import statement - brings external functionality into the program.';
        }
        
        if (line.includes('class ') || line.includes('interface ')) {
            return 'Class/Interface declaration - defines a blueprint for objects.';
        }
        
        if (line.includes('public ') || line.includes('private ') || line.includes('protected ')) {
            return 'Access modifier - controls visibility of class members.';
        }
        
        if (line.includes('static ')) {
            return 'Static keyword - makes member belong to class rather than object instances.';
        }
        
        if (line.includes('void ') || line.includes('def ') || line.includes('function ')) {
            return 'Function/method declaration - defines reusable block of code.';
        }
        
        if (line.includes('if ') || line.includes('else ')) {
            return 'Conditional statement - makes decisions based on conditions.';
        }
        
        if (line.includes('for ') || line.includes('while ')) {
            return 'Loop - repeats code multiple times.';
        }
        
        if (line.includes('return ')) {
            return 'Return statement - sends value back from function.';
        }
        
        if (line.includes('System.out') || line.includes('console.log') || line.includes('print(')) {
            return 'Output statement - displays information to user.';
        }
        
        if (line.includes('new ')) {
            return 'Object creation - creates new instance of a class.';
        }
        
        if (line.includes('=')) {
            return 'Assignment - stores value in variable.';
        }
        
        if (line.includes('//') || line.includes('# ')) {
            return 'Comment - explanatory text ignored by compiler.';
        }
        
        return 'Code line performing specific operation.';
    }

    explainParameter(param, funcName, language) {
        const paramLower = param.toLowerCase();
        
        const explanations = {
            'n': 'Number to process',
            'num': 'Numeric value',
            'number': 'Input number',
            'input': 'User-provided data',
            'value': 'Data value',
            'arr': 'Array of elements',
            'array': 'Collection of items',
            'list': 'List of values',
            'str': 'String/text',
            'string': 'Text data',
            'bool': 'Boolean (true/false) value',
            'scanner': 'Input reader object',
            'args': 'Command-line arguments'
        };
        
        for (const [key, explanation] of Object.entries(explanations)) {
            if (paramLower.includes(key)) {
                return explanation;
            }
        }
        
        return `Parameter for ${funcName} function`;
    }

    describeFunctionWorkflow(func, code, language) {
        const funcCode = this.extractFunctionCode(func.name, code);
        let workflow = '';
        
        if (funcCode.includes('if ') && funcCode.includes('for ')) {
            workflow += `1. Accepts input parameters\n`;
            workflow += `2. Validates input (if applicable)\n`;
            workflow += `3. Uses loops to process data\n`;
            workflow += `4. Makes decisions with if-else\n`;
            workflow += `5. Calculates or transforms data\n`;
            workflow += `6. Returns result or performs action\n`;
        } else if (funcCode.includes('for ')) {
            workflow += `1. Initializes variables\n`;
            workflow += `2. Enters loop for repeated processing\n`;
            workflow += `3. Performs operations in each iteration\n`;
            workflow += `4. Updates loop control variable\n`;
            workflow += `5. Exits loop when condition met\n`;
            workflow += `6. Returns final result\n`;
        } else if (funcCode.includes('if ')) {
            workflow += `1. Receives input parameters\n`;
            workflow += `2. Evaluates conditions\n`;
            workflow += `3. Executes appropriate code path\n`;
            workflow += `4. Returns result based on conditions\n`;
        } else {
            workflow += `1. Function is called with parameters\n`;
            workflow += `2. Parameters are processed\n`;
            workflow += `3. Operations are performed\n`;
            workflow += `4. Result is returned or action taken\n`;
        }
        
        return workflow;
    }

    detectClassType(className, code) {
        const classLower = className.toLowerCase();
        
        if (classLower.includes('controller')) return 'MVC Controller - handles user input';
        if (classLower.includes('service')) return 'Service Class - business logic';
        if (classLower.includes('repository') || classLower.includes('dao')) return 'Data Access - database operations';
        if (classLower.includes('model')) return 'Data Model - represents data structure';
        if (classLower.includes('view')) return 'View - presentation layer';
        if (classLower.includes('helper') || classLower.includes('util')) return 'Utility Class - helper functions';
        if (classLower.includes('factory')) return 'Factory Pattern - creates objects';
        if (classLower.includes('builder')) return 'Builder Pattern - constructs complex objects';
        
        // Check if it has main method
        if (code.includes(`class ${className}`) && code.includes('public static void main')) {
            return 'Main Class - program entry point';
        }
        
        return 'General Purpose Class';
    }

    generateSampleParameters(func) {
        if (!func.params || func.params.length === 0) return '';
        
        const sampleValues = {
            'int': '42',
            'integer': '42',
            'num': '42',
            'n': '10',
            'number': '100',
            'string': '"hello"',
            'str': '"test"',
            'text': '"sample text"',
            'bool': 'true',
            'boolean': 'false',
            'arr': '[1, 2, 3]',
            'array': 'new int[]{1, 2, 3}',
            'list': 'List.of(1, 2, 3)',
            'scanner': 'new Scanner(System.in)'
        };
        
        return func.params.map(param => {
            const paramLower = param.toLowerCase();
            for (const [key, value] of Object.entries(sampleValues)) {
                if (paramLower.includes(key)) {
                    return value;
                }
            }
            return 'null';
        }).join(', ');
    }

    generateCompleteExample(language) {
        if (language === 'java') {
            return `// Complete Java Example
import java.util.Scanner;

public class CompleteExample {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.print("Enter a number: ");
        int number = scanner.nextInt();
        
        // Process the number
        int result = number * 2;
        
        System.out.println("Double of " + number + " is: " + result);
        
        scanner.close();
    }
}`;
        } else if (language === 'python') {
            return `# Complete Python Example

def main():
    number = int(input("Enter a number: "))
    
    # Process the number
    result = number * 2
    
    print(f"Double of {number} is: {result}")

if __name__ == "__main__":
    main()`;
        } else if (language === 'javascript') {
            return `// Complete JavaScript Example
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question('Enter a number: ', (number) => {
    // Process the number
    const result = parseInt(number) * 2;
    
    console.log(\`Double of \${number} is: \${result}\`);
    
    readline.close();
});`;
        }
        
        return `// Complete ${language.toUpperCase()} Example\n// Implement based on your specific needs`;
    }

    // Existing helper methods (kept from your original code)
    extractFunctions(code, language) {
        const functions = [];
        const patterns = {
            javascript: /(?:function\s+(\w+)\s*\(([^)]*)\)|const\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>|let\s+(\w+)\s*=\s*\(([^)]*)\)\s*=>|async\s+function\s+(\w+)\s*\(([^)]*)\))/g,
            python: /def\s+(\w+)\s*\(([^)]*)\):/g,
            java: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(([^)]*)\)/g,
            cpp: /\w+\s+(\w+)\s*\(([^)]*)\)/g,
            csharp: /(?:public|private|protected)?\s*(?:static)?\s*\w+\s+(\w+)\s*\(([^)]*)\)/g,
            php: /function\s+(\w+)\s*\(([^)]*)\)/g,
            ruby: /def\s+(\w+)\s*\(([^)]*)\)/g,
            go: /func\s+(\w+)\s*\(([^)]*)\)/g,
            rust: /fn\s+(\w+)\s*\(([^)]*)\)/g,
            swift: /func\s+(\w+)\s*\(([^)]*)\)/g,
            kotlin: /fun\s+(\w+)\s*\(([^)]*)\)/g
        };
        
        const pattern = patterns[language] || patterns.javascript;
        let match;
        
        while ((match = pattern.exec(code)) !== null) {
            const name = match[1] || match[3] || match[5] || match[7] || 'unknown';
            const params = (match[2] || match[4] || match[6] || match[8] || '').split(',').map(p => p.trim()).filter(p => p);
            
            if (name && !['if', 'for', 'while', 'switch', 'catch', 'try'].includes(name)) {
                functions.push({
                    name: name,
                    purpose: this.getFunctionPurpose(name, code),
                    params: params,
                    returnType: this.getReturnType(name, code, language)
                });
            }
        }
        
        return functions;
    }

    extractVariables(code, language) {
        const variables = [];
        const patterns = {
            javascript: /(?:let|const|var)\s+(\w+)/g,
            python: /(\w+)\s*=\s*(?!['"]|def|class|if|for|while|lambda)/g,
            java: /(?:int|String|double|float|boolean|char|long|short|byte)\s+(\w+)/g,
            cpp: /(?:int|string|double|float|bool|char|long|short)\s+(\w+)/g,
            csharp: /(?:int|string|double|float|bool|char|decimal)\s+(\w+)/g,
            php: /\$(\\w+)/g,
            ruby: /(\w+)\s*=/g,
            go: /(?:var\s+(\w+)|(\w+)\s*:=)/g
        };
        
        const pattern = patterns[language] || patterns.javascript;
        let match;
        
        while ((match = pattern.exec(code)) !== null) {
            const name = match[1] || match[2];
            if (name && !['function', 'class', 'if', 'for', 'while', 'return', 'import', 'require'].includes(name)) {
                variables.push({
                    name: name,
                    type: this.detectVariableTypeFromCode(code, name, language)
                });
            }
        }
        
        return variables.slice(0, 15);
    }

    detectVariableTypeFromCode(code, varName, language) {
        const line = code.split('\n').find(line => line.includes(varName));
        if (!line) return 'unknown';
        
        if (language === 'java' || language === 'cpp' || language === 'csharp') {
            if (line.includes('int ' + varName)) return 'int';
            if (line.includes('String ' + varName) || line.includes('string ' + varName)) return 'string';
            if (line.includes('double ' + varName) || line.includes('float ' + varName)) return 'float';
            if (line.includes('boolean ' + varName) || line.includes('bool ' + varName)) return 'boolean';
            if (line.includes('char ' + varName)) return 'char';
        }
        
        if (language === 'javascript') {
            if (line.includes(varName + ' = []') || line.includes(varName + '= [')) return 'array';
            if (line.includes(varName + ' = {}') || line.includes(varName + '= {')) return 'object';
            if (line.includes(varName + " = '") || line.includes(varName + ' = "')) return 'string';
            if (line.includes(varName + ' = true') || line.includes(varName + ' = false')) return 'boolean';
            if (line.includes(varName + ' = ') && !isNaN(parseInt(line.split(varName + ' = ')[1]))) return 'number';
        }
        
        if (language === 'python') {
            if (line.includes(varName + ' = []') || line.includes(varName + '= [')) return 'list';
            if (line.includes(varName + ' = {}') || line.includes(varName + '= {')) return 'dict';
            if (line.includes(varName + " = '") || line.includes(varName + ' = "')) return 'str';
            if (line.includes(varName + ' = True') || line.includes(varName + ' = False')) return 'bool';
            if (line.includes(varName + ' = ') && !isNaN(parseFloat(line.split(varName + ' = ')[1]))) return 'int/float';
        }
        
        return 'variable';
    }

    extractClasses(code, language) {
        const classes = [];
        const patterns = {
            javascript: /class\s+(\w+)/g,
            python: /class\s+(\w+)/g,
            java: /(?:public\s+)?class\s+(\w+)/g,
            cpp: /class\s+(\w+)/g,
            csharp: /(?:public\s+)?class\s+(\w+)/g,
            php: /class\s+(\w+)/g,
            ruby: /class\s+(\w+)/g,
            swift: /class\s+(\w+)/g,
            kotlin: /class\s+(\w+)/g
        };
        
        const pattern = patterns[language];
        if (!pattern) return classes;
        
        let match;
        while ((match = pattern.exec(code)) !== null) {
            const className = match[1];
            classes.push({
                name: className,
                purpose: this.getClassPurpose(className),
                methods: this.getClassMethods(className, code, language)
            });
        }
        
        return classes;
    }

    extractImports(code, language) {
        const imports = [];
        const patterns = {
            javascript: /(?:import\s+(?:\{.*?\}\s+from\s+)?['"]([^'"]+)['"]|require\s*\(['"]([^'"]+)['"]\))/g,
            python: /(?:import\s+(\w+)|from\s+(\w+)\s+import)/g,
            java: /import\s+([^;]+);/g,
            cpp: /#include\s*[<"]([^>"]+)[>"]/g,
            csharp: /using\s+([^;]+);/g,
            php: /(?:use\s+([^;]+);|require(?:_once)?\s*\(['"]([^'"]+)['"]\))/g,
            go: /import\s+(?:"([^"]+)"|\([^)]+\))/g
        };
        
        const pattern = patterns[language];
        if (!pattern) return imports;
        
        let match;
        while ((match = pattern.exec(code)) !== null) {
            const imp = match[1] || match[2];
            if (imp && !imp.includes('*')) {
                imports.push(imp);
            }
        }
        
        return imports.slice(0, 10);
    }

    getFunctionPurpose(name, code) {
        const purposes = {
            'main': 'Entry point of the program - starts execution',
            'calculate': 'Performs mathematical calculations',
            'compute': 'Computes values or results',
            'process': 'Processes or transforms data',
            'validate': 'Validates input data or conditions',
            'check': 'Checks conditions or validity',
            'get': 'Retrieves data or information',
            'set': 'Sets or updates values',
            'create': 'Creates new objects or data',
            'delete': 'Deletes or removes data',
            'remove': 'Removes items or data',
            'update': 'Updates existing information',
            'find': 'Searches for data',
            'search': 'Searches through data',
            'sort': 'Sorts data in order',
            'filter': 'Filters data based on criteria',
            'print': 'Prints or displays output',
            'display': 'Shows information to user',
            'show': 'Displays results or data',
            'save': 'Saves data to storage',
            'load': 'Loads data from storage',
            'read': 'Reads input or data',
            'write': 'Writes data to output',
            'execute': 'Executes commands or operations',
            'run': 'Runs processes or operations',
            'start': 'Starts processes or operations',
            'stop': 'Stops processes or operations',
            'init': 'Initializes components or data',
            'setup': 'Sets up configuration or environment'
        };
        
        const lowerName = name.toLowerCase();
        for (const [key, purpose] of Object.entries(purposes)) {
            if (lowerName.includes(key)) {
                return purpose;
            }
        }
        
        return `Performs ${name.toLowerCase()} related operations`;
    }

    getClassPurpose(className) {
        const purposes = {
            'controller': 'Handles application logic and user input',
            'service': 'Provides business logic services',
            'repository': 'Manages data access and storage',
            'dao': 'Data Access Object - handles database operations',
            'model': 'Represents data structure and business entities',
            'entity': 'Represents a data entity',
            'view': 'Handles presentation and user interface',
            'helper': 'Provides utility functions and helpers',
            'util': 'Utility class with helper methods',
            'manager': 'Manages specific operations or resources',
            'factory': 'Creates objects (Factory Pattern)',
            'builder': 'Builds complex objects (Builder Pattern)',
            'adapter': 'Adapts interfaces (Adapter Pattern)',
            'singleton': 'Ensures single instance (Singleton Pattern)',
            'observer': 'Implements observer pattern',
            'strategy': 'Implements strategy pattern',
            'decorator': 'Adds functionality dynamically (Decorator Pattern)'
        };
        
        const lowerName = className.toLowerCase();
        for (const [key, purpose] of Object.entries(purposes)) {
            if (lowerName.includes(key)) {
                return purpose;
            }
        }
        
        return `Manages ${className.toLowerCase()} related functionality`;
    }

    getClassMethods(className, code, language) {
        const methods = [];
        const classStart = code.indexOf(`class ${className}`);
        if (classStart === -1) return methods;
        
        const classEnd = this.findClassEnd(code, classStart);
        const classCode = code.substring(classStart, classEnd);
        
        const functions = this.extractFunctions(classCode, language);
        return functions.map(f => f.name).slice(0, 8);
    }

    findClassEnd(code, startIndex) {
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        let inComment = false;
        
        for (let i = startIndex; i < code.length; i++) {
            const char = code[i];
            const prevChar = code[i - 1];
            
            // Handle comments
            if (!inString) {
                if (char === '/' && code[i + 1] === '*') {
                    inComment = true;
                }
                if (char === '*' && code[i + 1] === '/') {
                    inComment = false;
                    i++; // Skip next char
                    continue;
                }
                if (char === '/' && code[i + 1] === '/') {
                    // Skip to end of line
                    while (i < code.length && code[i] !== '\n') i++;
                    continue;
                }
            }
            
            if (inComment) continue;
            
            // Handle strings
            if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
                if (!inString) {
                    inString = true;
                    stringChar = char;
                } else if (char === stringChar) {
                    inString = false;
                }
            }
            
            if (!inString) {
                if (char === '{') braceCount++;
                else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        return i + 1;
                    }
                }
            }
        }
        
        return code.length;
    }

    getReturnType(functionName, code, language) {
        if (language === 'java' || language === 'cpp' || language === 'csharp') {
            const pattern = new RegExp(`\\w+\\s+${functionName}\\s*\\(`, 'g');
            const match = pattern.exec(code);
            if (match) {
                const beforeFunction = code.substring(0, match.index);
                const lines = beforeFunction.split('\n');
                const lastLine = lines[lines.length - 1].trim();
                const words = lastLine.split(/\s+/);
                return words[words.length - 1] || 'void';
            }
        }
        return 'unknown';
    }

    getVariablePurpose(name, type) {
        const purposes = {
            'count': 'Counts items or iterations',
            'counter': 'Loop counter or item counter',
            'total': 'Stores total sum or aggregate',
            'sum': 'Accumulates sum of values',
            'result': 'Stores calculation result',
            'output': 'Holds output data',
            'input': 'Holds input data',
            'temp': 'Temporary storage for intermediate values',
            'tmp': 'Temporary variable',
            'index': 'Array or loop index',
            'i': 'Loop index (conventional)',
            'j': 'Nested loop index',
            'k': 'Third level loop index',
            'flag': 'Boolean flag for conditions',
            'status': 'Status indicator',
            'error': 'Error flag or message',
            'success': 'Success indicator',
            'value': 'Generic value storage',
            'data': 'Data storage',
            'item': 'Single item from collection',
            'element': 'Collection element',
            'number': 'Numeric value',
            'string': 'Text data',
            'array': 'Collection of items',
            'list': 'List of values',
            'map': 'Key-value pairs',
            'object': 'Object instance',
            'instance': 'Class instance',
            'scanner': 'Input reader object',
            'reader': 'Input reader',
            'writer': 'Output writer'
        };
        
        const lowerName = name.toLowerCase();
        for (const [key, purpose] of Object.entries(purposes)) {
            if (lowerName.includes(key)) {
                return purpose;
            }
        }
        
        return `Stores ${type} data for program use`;
    }

    analyzeComplexity(code) {
        const features = [];
        let level = 'Simple';
        
        // Count various elements
        const ifCount = (code.match(/if\s*\(/g) || []).length;
        const loopCount = (code.match(/(for|while|do)\s*\(/g) || []).length;
        const classCount = (code.match(/class\s+\w+/g) || []).length;
        const functionCount = (code.match(/function\s+\w+|def\s+\w+|public.*\(|private.*\(/g) || []).length;
        const tryCount = (code.match(/try\s*\{/g) || []).length;
        
        if (ifCount > 5) features.push('Multiple conditional statements');
        if (loopCount > 3) features.push('Multiple loops and iterations');
        if (classCount > 2) features.push('Object-oriented with multiple classes');
        else if (classCount > 0) features.push('Object-oriented programming');
        if (functionCount > 8) features.push('Modular design with many functions');
        else if (functionCount > 3) features.push('Functional programming approach');
        if (tryCount > 0) features.push('Error handling and exception management');
        
        // Determine complexity level
        if (classCount > 3 || (ifCount > 8 && loopCount > 4)) {
            level = 'Advanced';
        } else if (classCount > 0 || ifCount > 3 || loopCount > 2) {
            level = 'Intermediate';
        }
        
        if (features.length === 0) {
            features.push('Basic sequential execution');
        }
        
        return { level, features };
    }

    detectLanguage(filename, content) {
        const ext = filename.split('.').pop().toLowerCase();
        
        const languageMap = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'cc': 'cpp',
            'cxx': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'go': 'go',
            'rs': 'rust',
            'kt': 'kotlin',
            'swift': 'swift',
            'html': 'html',
            'css': 'css',
            'sql': 'sql',
            'sh': 'shell',
            'bash': 'shell',
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'txt': 'text'
        };
        
        return languageMap[ext] || 'unknown';
    }

    extractFunctionCode(funcName, code) {
        const lines = code.split('\n');
        let funcStart = -1;
        let braceCount = 0;
        let funcCode = '';
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(funcName) && lines[i].includes('(')) {
                funcStart = i;
            }
            
            if (funcStart !== -1) {
                funcCode += lines[i] + '\n';
                braceCount += (lines[i].match(/\{/g) || []).length;
                braceCount -= (lines[i].match(/\}/g) || []).length;
                
                if (braceCount === 0 && funcStart !== i) {
                    break;
                }
            }
        }
        
        return funcCode;
    }
}

export default new GeminiService();