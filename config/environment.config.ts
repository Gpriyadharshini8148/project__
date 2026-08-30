/**
 * Centralized Environment Configuration
 * 
 * Purpose: Single source of truth for environment-specific settings
 * Benefits: 
 * - Easy to modify URLs, timeouts, etc. in one place
 * - Type-safe configuration
 * - Environment-specific overrides
 */

export interface EnvironmentConfig {
  urls: {
    fosCustomer: string;
    fosAdmin: string;
    fos: string;
  };
  credentials: {
    fosUsername: string;
    fosPassword: string;
    adminUsername: string;
    adminPassword: string;
    fos: {
      username: string;
      password: string;
    };
    admin: {
      username: string;
      password: string;
    };
  };
  timeouts: {
    navigation: number;
    element: number;
    test: number;
  };
  retry: {
    count: number;
  };
  excel: {
    defaultSuite: string;
    suiteName: string;
    dataPath: string;
  };
  features: {
    slowMo: number;
    headless: boolean;
    screenshot: 'on' | 'off' | 'only-on-failure';
    video: 'on' | 'off' | 'retain-on-failure';
  };
}

/**
 * Load configuration from environment variables with fallbacks
 */
export const config: EnvironmentConfig = {
  urls: {
    fosCustomer: process.env.FOS_URL || 'https://bajaj4--n2ppos.sandbox.my.site.com/dealercommunityreinvent/s/login/',
    fosAdmin: process.env.ADMIN_URL || 'https://bajaj4--n2ppos.sandbox.my.salesforce.com',
    fos: process.env.FOS_URL || 'https://bajaj4--n2ppos.sandbox.my.site.com/dealercommunityreinvent/s/login/',
  },
  
  credentials: {
    fosUsername: process.env.FOS_USERNAME || '',
    fosPassword: process.env.FOS_PASSWORD || '',
    adminUsername: process.env.ADMIN_USERNAME || '',
    adminPassword: process.env.ADMIN_PASSWORD || '',
    fos: {
      username: process.env.FOS_USERNAME || '',
      password: process.env.FOS_PASSWORD || '',
    },
    admin: {
      username: process.env.ADMIN_USERNAME || '',
      password: process.env.ADMIN_PASSWORD || '',
    },
  },
  
  timeouts: {
    navigation: parseInt(process.env.NAVIGATION_TIMEOUT || '60000'),
    element: parseInt(process.env.ELEMENT_TIMEOUT || '30000'),
    test: parseInt(process.env.TEST_TIMEOUT || '300000'),
  },
  
  retry: {
    count: parseInt(process.env.RETRY_COUNT || '0'),
  },
  
  excel: {
    defaultSuite: process.env.EXCEL_SUITE_NAME || 'TC_01_E2E_SanityUIFlow',
    suiteName: process.env.EXCEL_SUITE_NAME || 'TC_01_E2E_SanityUIFlow',
    dataPath: 'test-data/TestData.xlsx',
  },
  
  features: {
    slowMo: parseInt(process.env.SLOW_MO || '500'),
    headless: process.env.HEADLESS === 'true',
    screenshot: (process.env.SCREENSHOT as any) || 'only-on-failure',
    video: (process.env.VIDEO as any) || 'retain-on-failure',
  },
};

/**
 * Validate configuration on import
 */
export function validateConfig(): void {
  const errors: string[] = [];
  
  if (!config.credentials.fosUsername) {
    errors.push('FOS_USERNAME is required');
  }
  
  if (!config.credentials.fosPassword) {
    errors.push('FOS_PASSWORD is required');
  }
  
  if (errors.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    errors.forEach(error => console.warn(`   - ${error}`));
    console.warn('   Set these in your .env file\n');
  }
}

// Auto-validate on import
validateConfig();

/**
 * Helper: Get environment name
 */
export function getEnvironment(): 'DEV' | 'QA' | 'UAT' | 'PREPROD' | 'PROD' {
  return (process.env.ENVIRONMENT || 'PREPROD') as any;
}

/**
 * Helper: Check if running in CI
 */
export function isCIEnvironment(): boolean {
  return process.env.CI === 'true' || process.env.HEADLESS === 'true';
}

/**
 * Helper: Get Excel suite name with fallback
 */
export function getExcelSuiteName(override?: string): string {
  return override || config.excel.defaultSuite;
}

/**
 * Usage Example:
 * 
 * import { config } from '../config/environment.config';
 * 
 * // In your test:
 * await loginPage.loginToFOS(config.urls.fosCustomer, config.credentials.fosUsername, ...);
 * 
 * // Or with getter:
 * import { getExcelSuiteName } from '../config/environment.config';
 * const suiteName = getExcelSuiteName('TC_03_ZipCode');
 */
