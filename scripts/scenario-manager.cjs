#!/usr/bin/env node

/**
 * Test Scenario Manager
 * 
 * Manage existing test scenarios - list, enable, disable, or remove them
 * 
 * Usage:
 *   node scripts/scenario-manager.cjs [command]
 * 
 * Commands:
 *   list      - List all test scenarios
 *   enable    - Enable a test scenario
 *   disable   - Disable a test scenario
 *   remove    - Remove a test scenario completely
 *   stats     - Show test statistics
 * 
 * Or via npm:
 *   npm run manage:scenario
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Find all test files
function findTestFiles() {
  const testsDir = path.join(process.cwd(), 'tests');
  const testFiles = [];

  function scanDirectory(dir, category = '') {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath, item);
      } else if (item.endsWith('.spec.ts')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const describeMatch = content.match(/test\.describe\(['"`](.+?)['"`]/);
        const testName = describeMatch ? describeMatch[1] : item.replace('.spec.ts', '');
        
        // Count tests in file
        const testMatches = content.match(/test\(['"`]/g);
        const testCount = testMatches ? testMatches.length : 0;
        
        testFiles.push({
          fileName: item,
          filePath: fullPath,
          relativePath: path.relative(testsDir, fullPath),
          category: category || 'root',
          testName,
          testCount,
          size: (stat.size / 1024).toFixed(2) + ' KB'
        });
      }
    });
  }

  scanDirectory(testsDir);
  return testFiles;
}

// List all scenarios
function listScenarios() {
  log('\n╔════════════════════════════════════════════════════╗', 'cyan');
  log('║         Test Scenarios Overview                   ║', 'cyan');
  log('╚════════════════════════════════════════════════════╝\n', 'cyan');

  const testFiles = findTestFiles();
  
  // Group by category
  const grouped = {};
  testFiles.forEach(file => {
    if (!grouped[file.category]) {
      grouped[file.category] = [];
    }
    grouped[file.category].push(file);
  });

  // Display by category
  Object.keys(grouped).sort().forEach(category => {
    log(`\n📁 ${category.toUpperCase()}`, 'bright');
    log('─'.repeat(60), 'dim');
    
    grouped[category].forEach((file, index) => {
      log(`${index + 1}. ${file.testName}`, 'green');
      log(`   File: ${file.fileName} (${file.testCount} tests, ${file.size})`, 'dim');
    });
  });

  log(`\n📊 Total: ${testFiles.length} test files`, 'bright');
  return testFiles;
}

// Show statistics
function showStats() {
  log('\n╔════════════════════════════════════════════════════╗', 'cyan');
  log('║         Test Statistics                           ║', 'cyan');
  log('╚════════════════════════════════════════════════════╝\n', 'cyan');

  const testFiles = findTestFiles();
  
  // Calculate stats
  const stats = {
    totalFiles: testFiles.length,
    totalTests: testFiles.reduce((sum, file) => sum + file.testCount, 0),
    byCategory: {},
    totalSize: testFiles.reduce((sum, file) => sum + parseFloat(file.size), 0).toFixed(2)
  };

  testFiles.forEach(file => {
    if (!stats.byCategory[file.category]) {
      stats.byCategory[file.category] = { files: 0, tests: 0 };
    }
    stats.byCategory[file.category].files++;
    stats.byCategory[file.category].tests += file.testCount;
  });

  log(`📦 Total Test Files: ${stats.totalFiles}`, 'green');
  log(`✓ Total Tests: ${stats.totalTests}`, 'green');
  log(`💾 Total Size: ${stats.totalSize} KB`, 'green');
  
  log('\n📊 Breakdown by Category:', 'bright');
  Object.keys(stats.byCategory).sort().forEach(category => {
    const cat = stats.byCategory[category];
    log(`   ${category}: ${cat.files} files, ${cat.tests} tests`, 'cyan');
  });
}

// Enable/Disable scenarios via Excel would require xlsx manipulation
// For now, provide instructions
function showEnableDisableInstructions() {
  log('\n╔════════════════════════════════════════════════════╗', 'yellow');
  log('║   Enable/Disable Test Scenarios                   ║', 'yellow');
  log('╚════════════════════════════════════════════════════╝\n', 'yellow');

  log('To enable or disable test scenarios:', 'bright');
  log('\n1. Open: test-data/TestData.xlsx', 'cyan');
  log('2. Go to: TestConfig sheet', 'cyan');
  log('3. Find the test row (SpecFile column)', 'cyan');
  log('4. Change ExecutionFlag to:');
  log('   - "yes" to enable', 'green');
  log('   - "no" to disable', 'red');
  log('5. Save the file', 'cyan');
  log('6. Run: npm run validate', 'cyan');
  log('\nOR use Playwright test filtering:', 'bright');
  log('   npm test tests/customer/    # Run only customer tests', 'dim');
  log('   npm test --grep @smoke      # Run only smoke tests', 'dim');
}

// Remove scenario
async function removeScenario() {
  log('\n╔════════════════════════════════════════════════════╗', 'red');
  log('║   Remove Test Scenario                            ║', 'red');
  log('╚════════════════════════════════════════════════════╝\n', 'red');

  const testFiles = findTestFiles();
  
  log('Available test files:', 'bright');
  testFiles.forEach((file, index) => {
    log(`${index + 1}. ${file.relativePath} - ${file.testName}`, 'cyan');
  });

  const selection = await question(colors.yellow + '\nEnter number to remove (or 0 to cancel): ' + colors.reset);
  const index = parseInt(selection) - 1;

  if (index < 0 || index >= testFiles.length) {
    log('❌ Invalid selection or cancelled', 'red');
    return;
  }

  const selected = testFiles[index];
  log(`\n⚠️  You are about to remove:`, 'yellow');
  log(`   File: ${selected.relativePath}`, 'yellow');
  log(`   Tests: ${selected.testCount}`, 'yellow');

  const confirm = await question(colors.red + '\nType "DELETE" to confirm: ' + colors.reset);

  if (confirm === 'DELETE') {
    try {
      fs.unlinkSync(selected.filePath);
      log(`\n✓ Removed: ${selected.relativePath}`, 'green');
      log('\n📝 Don\'t forget to:', 'bright');
      log('   1. Remove corresponding Excel data from TestData.xlsx', 'cyan');
      log('   2. Remove row from TestConfig sheet', 'cyan');
      log('   3. Remove Page Object if no longer needed', 'cyan');
    } catch (error) {
      log(`\n❌ Error removing file: ${error.message}`, 'red');
    }
  } else {
    log('\n❌ Removal cancelled', 'yellow');
  }
}

// Main menu
async function showMenu() {
  log('\n╔════════════════════════════════════════════════════╗', 'cyan');
  log('║      Test Scenario Manager - Main Menu           ║', 'cyan');
  log('╚════════════════════════════════════════════════════╝\n', 'cyan');

  log('1. List all scenarios', 'green');
  log('2. Show statistics', 'green');
  log('3. Enable/Disable instructions', 'green');
  log('4. Remove a scenario', 'red');
  log('5. Exit\n', 'dim');

  const choice = await question(colors.yellow + 'Select option: ' + colors.reset);

  switch (choice) {
    case '1':
      listScenarios();
      await question('\nPress Enter to continue...');
      await showMenu();
      break;
    case '2':
      showStats();
      await question('\nPress Enter to continue...');
      await showMenu();
      break;
    case '3':
      showEnableDisableInstructions();
      await question('\nPress Enter to continue...');
      await showMenu();
      break;
    case '4':
      await removeScenario();
      await question('\nPress Enter to continue...');
      await showMenu();
      break;
    case '5':
      log('\nGoodbye! 👋\n', 'cyan');
      rl.close();
      break;
    default:
      log('\n❌ Invalid option', 'red');
      await showMenu();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    if (command === 'list') {
      listScenarios();
      rl.close();
    } else if (command === 'stats') {
      showStats();
      rl.close();
    } else if (command === 'enable' || command === 'disable') {
      showEnableDisableInstructions();
      rl.close();
    } else if (command === 'remove') {
      await removeScenario();
      rl.close();
    } else {
      await showMenu();
    }
  } catch (error) {
    log('\n❌ Error: ' + error.message, 'red');
    process.exit(1);
  }
}

main();
