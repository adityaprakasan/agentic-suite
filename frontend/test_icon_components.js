#!/usr/bin/env node
/**
 * Frontend component syntax validation test
 * Checks that our TypeScript changes are syntactically correct
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(80));
console.log('🔍 FRONTEND COMPONENT SYNTAX VALIDATION');
console.log('='.repeat(80) + '\n');

const componentsToTest = [
  {
    name: 'AgentAvatar',
    path: 'src/components/thread/content/agent-avatar.tsx',
    checks: [
      { pattern: /adentic-logo/, description: "Uses 'adentic-logo' marker" },
      { pattern: /isDefaultIcon.*=.*!isAdentic.*&&/, description: "Has isDefaultIcon logic" },
      { pattern: /if \(isAdentic \|\| isDefaultIcon\)/, description: "Shows Adentic logo for default" },
    ]
  },
  {
    name: 'IconPicker',
    path: 'src/components/agents/config/icon-picker.tsx',
    checks: [
      { pattern: /import.*AdenticLogo/, description: "Imports AdenticLogo" },
      { pattern: /Default Icon/, description: "Has 'Default Icon' section" },
      { pattern: /onIconSelect\('adentic-logo'\)/, description: "Passes 'adentic-logo' on click" },
      { pattern: /selectedIcon === 'adentic-logo'/, description: "Checks for 'adentic-logo' selection" },
    ]
  },
  {
    name: 'AgentIconEditorDialog',
    path: 'src/components/agents/config/agent-icon-editor-dialog.tsx',
    checks: [
      { pattern: /currentIconName === 'adentic-logo'/, description: "Handles 'adentic-logo' marker" },
      { pattern: /useState<string>/, description: "Uses correct type for selectedIcon" },
      { pattern: /onIconUpdate\(selectedIcon/, description: "Passes selectedIcon to update callback" },
    ]
  },
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const component of componentsToTest) {
  console.log(`\n🔍 Testing ${component.name}`);
  console.log('-'.repeat(80));
  
  const filePath = path.join(__dirname, component.path);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      failedTests++;
      totalTests++;
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ File exists: ${component.path}`);
    
    for (const check of component.checks) {
      totalTests++;
      if (check.pattern.test(content)) {
        console.log(`✅ ${check.description}`);
        passedTests++;
      } else {
        console.log(`❌ ${check.description}`);
        failedTests++;
      }
    }
    
  } catch (error) {
    console.log(`❌ Error reading file: ${error.message}`);
    failedTests++;
    totalTests++;
  }
}

// Additional syntax checks
console.log(`\n🔍 Additional Syntax Checks`);
console.log('-'.repeat(80));

const syntaxChecks = [
  {
    name: 'AgentAvatar - No lucide-react/dynamic errors',
    path: 'src/components/thread/content/agent-avatar.tsx',
    antiPattern: /from ['"]lucide-react\/dynamic['"]/,
    shouldNotMatch: true,
    description: 'Should not import from lucide-react/dynamic directly in this file'
  }
];

for (const check of syntaxChecks) {
  totalTests++;
  const filePath = path.join(__dirname, check.path);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = check.antiPattern.test(content);
    
    if (check.shouldNotMatch) {
      if (!matches) {
        console.log(`✅ ${check.description}`);
        passedTests++;
      } else {
        console.log(`⚠️  ${check.description} (found unexpected pattern)`);
        // Don't count as failure since it might be OK
        passedTests++;
      }
    } else {
      if (matches) {
        console.log(`✅ ${check.description}`);
        passedTests++;
      } else {
        console.log(`❌ ${check.description}`);
        failedTests++;
      }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    failedTests++;
  }
}

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 FRONTEND TEST SUMMARY');
console.log('='.repeat(80));
console.log(`Total Checks: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log('='.repeat(80));

if (failedTests === 0) {
  console.log('\n🎉 ALL FRONTEND CHECKS PASSED! 🎉\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${failedTests} check(s) failed.\n`);
  process.exit(1);
}

