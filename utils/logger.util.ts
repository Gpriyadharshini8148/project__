import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enhanced Logger Utility
 * Provides step-level logging with pass/fail/info status
 * Inspired by Java Selenium framework logging patterns
 */
export class Logger {
  private static logFile: string;
  private static testName: string;
  private static stepNumber: number = 0;

  /**
   * Initialize logger for a test
   */
  static initTest(testName: string): void {
    this.testName = testName;
    this.stepNumber = 0;
    
    // Create logs directory if not exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    this.logFile = path.join(logsDir, `${testName}_${timestamp}.log`);
    
    this.writeToFile('\n' + '='.repeat(80));
    this.writeToFile(`TEST: ${testName}`);
    this.writeToFile(`START TIME: ${new Date().toISOString()}`);
    this.writeToFile('='.repeat(80) + '\n');
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 TEST: ${testName}`);
    console.log(`⏰ START TIME: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Log test step information
   */
  static step(message: string): void {
    this.stepNumber++;
    const logMessage = `[STEP ${this.stepNumber}] ${message}`;
    console.log(`\n📝 ${logMessage}`);
    this.writeToFile(logMessage);
  }

  /**
   * Log passed step
   */
  static passed(message: string): void {
    const logMessage = `✅ PASSED: ${message}`;
    console.log(`   ${logMessage}`);
    this.writeToFile(logMessage);
  }

  /**
   * Log failed step
   */
  static failed(message: string, error?: Error): void {
    const logMessage = `❌ FAILED: ${message}`;
    console.error(`   ${logMessage}`);
    this.writeToFile(logMessage);
    
    if (error) {
      console.error(`   Error: ${error.message}`);
      this.writeToFile(`   Error: ${error.message}`);
      if (error.stack) {
        this.writeToFile(`   Stack: ${error.stack}`);
      }
    }
  }

  /**
   * Log informational message
   */
  static info(message: string): void {
    const logMessage = `ℹ️  INFO: ${message}`;
    console.log(`   ${logMessage}`);
    this.writeToFile(logMessage);
  }

  /**
   * Log warning message
   */
  static warn(message: string): void {
    const logMessage = `⚠️  WARNING: ${message}`;
    console.warn(`   ${logMessage}`);
    this.writeToFile(logMessage);
  }

  /**
   * Log data value
   */
  static data(label: string, value: string | number | boolean): void {
    const logMessage = `📊 DATA: ${label} = ${value}`;
    console.log(`   ${logMessage}`);
    this.writeToFile(logMessage);
  }

  /**
   * Log action performed
   */
  static action(action: string, target?: string): void {
    const logMessage = target 
      ? `🎯 ACTION: ${action} → ${target}`
      : `🎯 ACTION: ${action}`;
    console.log(`   ${logMessage}`);
    this.writeToFile(logMessage);
  }

  /**
   * Log verification
   */
  static verify(message: string, result: boolean): void {
    if (result) {
      this.passed(`Verified: ${message}`);
    } else {
      this.failed(`Verification failed: ${message}`);
    }
  }

  /**
   * Log screenshot capture
   */
  static screenshot(description: string): void {
    const logMessage = `📸 SCREENSHOT: ${description}`;
    console.log(`   ${logMessage}`);
    this.writeToFile(logMessage);
  }

  /**
   * End test logging
   */
  static endTest(status: 'PASSED' | 'FAILED' = 'PASSED'): void {
    this.writeToFile('\n' + '='.repeat(80));
    this.writeToFile(`TEST END: ${this.testName}`);
    this.writeToFile(`END TIME: ${new Date().toISOString()}`);
    this.writeToFile(`STATUS: ${status}`);
    this.writeToFile('='.repeat(80) + '\n');
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏁 TEST END: ${this.testName}`);
    console.log(`⏰ END TIME: ${new Date().toLocaleString()}`);
    console.log(`${status === 'PASSED' ? '✅' : '❌'} STATUS: ${status}`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Log test data from Excel
   */
  static testData(data: Record<string, string>): void {
    console.log('\n📋 Test Data Loaded:');
    this.writeToFile('\n--- TEST DATA ---');
    Object.entries(data).forEach(([key, value]) => {
      // Mask sensitive data (password, token, secret)
      const maskedValue = key.toLowerCase().includes('password') || 
                          key.toLowerCase().includes('token') || 
                          key.toLowerCase().includes('secret')
        ? '*'.repeat(8)
        : value;
      console.log(`   ${key}: ${maskedValue}`);
      this.writeToFile(`${key}: ${maskedValue}`);
    });
    this.writeToFile('--- END TEST DATA ---\n');
  }

  /**
   * Log section header
   */
  static section(title: string): void {
    const separator = '-'.repeat(60);
    console.log(`\n${separator}`);
    console.log(`📁 ${title}`);
    console.log(`${separator}`);
    this.writeToFile(`\n${separator}`);
    this.writeToFile(title);
    this.writeToFile(separator);
  }

  /**
   * Write to log file
   */
  private static writeToFile(message: string): void {
    if (this.logFile) {
      try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(this.logFile, `[${timestamp}] ${message}\n`);
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  /**
   * Create summary of test execution
   */
  static summary(stats: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  }): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));
    console.log(`   Total Tests: ${stats.total}`);
    console.log(`   ✅ Passed: ${stats.passed}`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   ⏭️  Skipped: ${stats.skipped}`);
    console.log(`   Pass Rate: ${((stats.passed / stats.total) * 100).toFixed(2)}%`);
    console.log('='.repeat(80) + '\n');
    
    this.writeToFile('\n' + '='.repeat(80));
    this.writeToFile('TEST EXECUTION SUMMARY');
    this.writeToFile('='.repeat(80));
    this.writeToFile(`Total Tests: ${stats.total}`);
    this.writeToFile(`Passed: ${stats.passed}`);
    this.writeToFile(`Failed: ${stats.failed}`);
    this.writeToFile(`Skipped: ${stats.skipped}`);
    this.writeToFile(`Pass Rate: ${((stats.passed / stats.total) * 100).toFixed(2)}%`);
    this.writeToFile('='.repeat(80) + '\n');
  }
}

/**
 * Decorator for automatic test step logging
 * Usage: @logStep('Step description')
 */
export function logStep(description: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      Logger.step(description);
      try {
        const result = await originalMethod.apply(this, args);
        Logger.passed(description);
        return result;
      } catch (error) {
        Logger.failed(description, error as Error);
        throw error;
      }
    };

    return descriptor;
  };
}
