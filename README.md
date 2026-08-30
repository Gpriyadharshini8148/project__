# SFDC POS Playwright Automation Framework 🚀

> **Enterprise-Grade Test Automation** | TypeScript + Playwright | Excel-Driven | Production-Ready

[![Playwright](https://img.shields.io/badge/Playwright-1.61+-green.svg)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org/)

---

## 📑 Table of Contents

- [Quick Start](#-quick-start)
- [Framework Highlights](#-framework-highlights)
- [Test Structure](#-test-structure)
- [Installation](#%EF%B8%8F-installation)
- [Running Tests](#-running-tests)
- [Excel Test Data](#-excel-test-data-management)
- [Adding/Removing Scenarios](#-addingremoving-test-scenarios)
- [New Utilities & Features](#-new-utilities--features)
- [Project Structure](#-project-structure)
- [Regression Testing](#-regression-testing-strategy)
- [VM/CI Configuration](#%EF%B8%8F-vmci-configuration)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)
- [Comparison with Legacy Framework](#-comparison-with-legacy-java-selenium-framework)

---

## 🚀 Quick Start

```powershell
# 1. Setup (first time only)
npm run setup

# 2. Configure test data
# Edit: test-data/TestData.xlsx

# 3. Run tests
npm test                       # All tests
npm run test:chrome           # Watch tests run in browser
npm run test:smoke            # Quick smoke tests
npm run test:ui               # Interactive UI mode
```

---

## ✨ Framework Highlights

### **Why This Framework?**

✅ **Modern & Fast** - Playwright (10x faster than Selenium)  
✅ **Type-Safe** - Full TypeScript with IntelliSense  
✅ **Excel-Driven** - Non-technical users can manage test data  
✅ **Page Object Model** - Maintainable & reusable code  
✅ **Enhanced Logging** - Step-level logs with pass/fail/info status  
✅ **Screenshot Highlighting** - Visual indicators for debugging  
✅ **Fixture Pattern** - Automatic dependency injection  
✅ **Comprehensive Reporting** - HTML reports with screenshots & videos  
✅ **Production-Ready** - Error handling, retries, timeouts  
✅ **Easy Scenario Management** - Add/remove tests without coding  
✅ **CI/CD Ready** - Works with GitHub Actions, Azure DevOps, Jenkins  

### **Comparison with Legacy Java Selenium Framework**

| Feature | This Framework (TypeScript + Playwright) | Legacy (Java + Selenium) |
|---------|------------------------------------------|--------------------------|
| **Language** | TypeScript | Java |
| **Browser Automation** | Playwright (modern, fast) | Selenium (slower) |
| **Test Organization** | ✅ Clean folder structure | ❌ 100+ User Story folders |
| **Maintainability** | ✅ Easy to maintain | ❌ Hard to navigate |
| **Add/Remove Tests** | ✅ Simple (Excel + 1 file) | ❌ Complex setup |
| **Documentation** | ✅ Comprehensive guides | ❌ Missing |
| **Data Management** | ✅ Excel-driven with validation | ✅ Excel-based |
| **Logging** | ✅ Enhanced with colors & emojis | ✅ Basic logging |
| **Screenshots** | ✅ With element highlighting | ⚠️ Basic screenshots |
| **API Testing** | ✅ Built-in REST API utilities | ✅ REST Assured |
| **Parallel Execution** | ✅ Built-in | ✅ TestNG parallel |
| **Setup Time** | ✅ 5 minutes | ⚠️ 30+ minutes |
| **Learning Curve** | ✅ Easy | ⚠️ Steep |

**Verdict:** ✅ This framework is superior in every aspect - faster, cleaner, easier to maintain, and better documented.

---

## 📊 Test Structure

**96 Tests** across **14 Modular Files** + **3 E2E Flows**

### Customer Journey (`tests/customer/`) - 12 files, 69 tests
```
01_searchDealer.spec.ts        → Dealer search & mobile validation (5 tests)
02_appStatus.spec.ts           → Application status check (5 tests)
03_zipCode.spec.ts             → Zip code & customer details (6 tests)
04_mitc.spec.ts                → Terms & conditions (6 tests)
05_panVerification.spec.ts     → PAN verification (7 tests)
06_kyc.spec.ts                 → E-KYC verification (6 tests)
07_poi.spec.ts                 → Proof of identity upload (8 tests)
08_poa.spec.ts                 → Proof of address upload (6 tests)
09_productSelection.spec.ts    → Product catalog selection (9 tests)
10_incomeDeclaration.spec.ts   → Income verification (7 tests)
11_surrogateDetails.spec.ts    → Surrogate documents (7 tests)
12_assetCart.spec.ts           → Asset cart & final submission (9 tests)
```

### Admin & FOS (`tests/admin/`, `tests/fos/`) - 2 files, 13 tests
```
13_preApproval.spec.ts         → Admin approval workflow (7 tests)
14_postApproval.spec.ts        → FOS post-approval actions (6 tests)
```

### End-to-End Flows (`tests/e2e/`) - 3 files, 3 comprehensive flows
```
customer-journey.spec.ts       → Complete new customer application flow
admin-approval.spec.ts         → Full admin approval process
post-approval.spec.ts          → Complete post-approval workflow
```

---

## ⚙️ Installation

### Prerequisites

- **Node.js v18+** ([Download](https://nodejs.org/))
- **Windows 10/11** (or macOS/Linux)
- **Git** ([Download](https://git-scm.com/))
- **VS Code** (Recommended - [Download](https://code.visualstudio.com/))

### Automated Setup (Recommended)

```powershell
# Clone repository (if needed)
git clone <your-repo-url>
cd SFDC_POS_Playwright_TS

# Run automated setup
npm run setup
```

**What `npm run setup` does:**
1. ✅ Installs all Node.js dependencies
2. ✅ Installs Playwright browsers (Chromium)
3. ✅ Creates `.env` file from template
4. ✅ Validates Excel file structure
5. ✅ Runs verification tests
6. ✅ Shows setup summary

### Manual Setup (if automated fails)

```powershell
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Create environment file
copy .env.example .env

# Edit .env file with your credentials
notepad .env

# Verify installation
npm run verify
```

### Update .env File

```env
# FOS Customer Login
FOS_URL=https://your-fos-url.com
FOS_USERNAME=your-username@company.com
FOS_PASSWORD=your-password

# Admin Login
ADMIN_URL=https://your-admin-url.com
ADMIN_USERNAME=admin@company.com
ADMIN_PASSWORD=admin-password

# Configuration
HEADLESS=false
SLOW_MO=500
```

---

## ▶️ Running Tests

### Basic Execution

```powershell
# Run all tests
npm test

# Run with browser visible (headed mode)
npm run test:headed

# Run in UI mode (interactive)
npm run test:ui

# Run specific test file
npm test tests/customer/01_searchDealer.spec.ts

# Run specific test folder
npm test tests/customer/

# Run by test name pattern
npm test --grep "Valid dealer"
```

### Watch Tests Execute

```powershell
# Normal speed (500ms delay)
npm run test:chrome

# Slow motion (1000ms delay) - for demos
npm run test:slow

# Fast execution (no delay)
npm run test:fast

# Debug mode (step-by-step)
npm run test:debug
```

### Regression & CI/CD

```powershell
# Full regression suite
npm run test:regression

# Smoke tests only (fast)
npm run test:smoke

# Headless execution (for CI/CD)
npm run test:ci

# Generate HTML report
npm run report
```

### Parallel Execution

```powershell
# Run with 3 workers (faster execution)
npm run test:parallel

# Custom worker count
npx playwright test --workers=2
```

---

## 📊 Excel Test Data Management

### File Location
**Path:** `test-data/TestData.xlsx`

### Excel Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Sheet: TestData                                             │
├─────────────────────────────────────────────────────────────┤
│ TC_01_SearchDealer                     ← Suite Header       │
│ executionFlag              yes         ← Enable/Disable     │
│ environment                PREPROD     ← Environment        │
│ appurlcustomerlogin       https://...  ← Field:Value pairs  │
│ usernamecustomerlogin     user@co.com                       │
│ passwordcustomerlogin     Password123                       │
│ dealervalue               100203...                         │
│ mobilenumberlabel         Mobile Number                     │
│ searchbutton              Search                            │
│                                         ← Empty Row          │
├─────────────────────────────────────────────────────────────┤
│ TC_02_AppStatus                        ← Next Suite         │
│ executionFlag              yes                              │
│ environment                PREPROD                          │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Rules

✅ **DO:**
- Start each suite with `TC_##_SuiteName` (e.g., `TC_01_SearchDealer`)
- Use `executionFlag = yes` to run, `no` to skip
- Separate suites with empty rows
- Use lowercase field names (e.g., `dealervalue`, not `DealerValue`)
- Store static/reusable data (URLs, credentials, dealer codes)

❌ **DON'T:**
- Store dynamic data (mobile numbers, timestamps)
- Use spaces in field names (use `mobilenumber`, not `mobile number`)
- Forget empty row between suites
- Have duplicate field names in same suite

### Data Types

**✅ Store in Excel (Static):**
```
✓ URLs, Credentials
✓ Dealer codes, Branch codes
✓ Product names, Model numbers
✓ Dropdown values, Button labels
✓ UI text, Page titles
```

**✅ Generate in Code (Dynamic):**
```typescript
// Mobile numbers
const mobile = DataGenerator.generateMobileNumber();

// PAN numbers
const pan = DataGenerator.generatePanNumber();

// Aadhaar numbers
const aadhaar = DataGenerator.generateAadharNumber();

// Customer names
const name = DataGenerator.generateName();

// Bank account numbers
const account = DataGenerator.generateAccountNumber();

// Deal IDs
const dealID = DataGenerator.generateDealID();

// Card numbers
//const card = DataGenerator.generateCardNumber();

// Driving License
const license = DataGenerator.generateDrivingLicense();

// IFSC code
const ifsc = DataGenerator.generateIFSC();
```

### Validation

```powershell
# Validate Excel structure
npm run validate

# Check for issues:
# - Missing empty rows between suites
# - Duplicate suite names
# - Missing required fields
# - Invalid executionFlag values
```

---

## 🎯 Adding/Removing Test Scenarios

### ➕ Adding New Test Scenario

#### **Method 1: Create New Test File (Recommended for New Features)**

**Step 1: Add Test Data to Excel**

Open `test-data/TestData.xlsx` → Add after last suite:

```excel
TC_15_NewFeature
executionFlag              yes
environment                PREPROD
appurlcustomerlogin       https://your-url.com
usernamecustomerlogin     user@company.com
passwordcustomerlogin     Password@123
newFieldName1             value1
newFieldName2             value2

[EMPTY ROW]
```

**Step 2: Create Test File**

```typescript
// tests/customer/15_newFeature.spec.ts
import { test, expect } from '../../fixtures';
import { ExcelReader, DataGenerator, Logger } from '../../utils';
import { config } from '../../config/environment.config';

test.describe('15 - New Feature', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testData = excelReader.getTestDataForTestCase('TC_15_NewFeature');
    Logger.initTest('TC_15_NewFeature');
    console.log(`✓ Test Data Loaded: ${Object.keys(testData).length} fields`);
  });

  test.beforeEach(async ({ loginPage }) => {
    // Login before each test
    await loginPage.loginToFOS(
      testData['appurlcustomerlogin'] || config.urls.fosCustomer,
      testData['usernamecustomerlogin'] || config.credentials.fosUsername,
      testData['passwordcustomerlogin'] || config.credentials.fosPassword
    );
  });

  test('Positive: Valid scenario', async ({ page }) => {
    Logger.step('Perform new feature action');
    
    await test.step('Step 1: Navigate to feature', async () => {
      await page.goto('/new-feature');
      Logger.passed('Navigation successful');
    });

    await test.step('Step 2: Perform action', async () => {
      await page.fill('#input', testData['newFieldName1']);
      await page.click('button:has-text("Submit")');
      Logger.passed('Action completed');
    });

    await test.step('Step 3: Verify result', async () => {
      await expect(page.locator('.success-message')).toBeVisible();
      Logger.passed('Verification successful');
    });
  });

  test.afterAll(async () => {
    Logger.endTest('PASSED');
  });
});
```

**Step 3: Run New Test**

```powershell
npm test tests/customer/15_newFeature.spec.ts
```

#### **Method 2: Add Test Case to Existing File**

```typescript
// Add to existing file: tests/customer/01_searchDealer.spec.ts

test('New test case', async ({ dealerSearchPage }) => {
  await dealerSearchPage.performNewAction(testData['newField']);
  // ... test logic
});
```

**📚 For detailed step-by-step guide, see:** [HOW_TO_ADD_REMOVE_SCENARIOS.md](./HOW_TO_ADD_REMOVE_SCENARIOS.md)

---

### ➖ Removing Test Scenario

#### **Method 1: Disable in Excel (Recommended - No Code Change)**

Open `test-data/TestData.xlsx` → Change `executionFlag`:

```excel
TC_05_PanVerification
executionFlag              no    ← Change from 'yes' to 'no'
environment                PREPROD
...
```

✅ **Advantages:**
- No code changes needed
- Easy to re-enable later
- Good for environment-specific exclusions

#### **Method 2: Skip in Code (Temporary)**

```typescript
test.skip('Temporarily disabled', async ({ page }) => {
  // Test code remains but won't run
});

// Or skip entire suite
test.describe.skip('05 - PAN Verification', () => {
  // All tests skipped
});
```

#### **Method 3: Delete Files (Permanent)**

```powershell
# Delete test file
Remove-Item tests/customer/05_panVerification.spec.ts

# Delete Excel data block (manually in Excel)

# Delete page object (if no longer needed)
Remove-Item pages/customer-onboarding/PanPage.ts

# Update exports in pages/index.ts and fixtures/base.fixture.ts
```

---

## 🆕 New Utilities & Features

### **1. Enhanced Logger Utility**

Step-level logging with pass/fail/info status and emojis.

```typescript
import { Logger } from '../../utils';

// Initialize test
Logger.initTest('TC_01_SearchDealer');

// Log test steps
Logger.step('Search for dealer');
Logger.action('Click search button', 'Search');
Logger.data('Mobile Number', mobileNumber);
Logger.passed('Search successful');
Logger.failed('Search failed', error);
Logger.info('Additional information');
Logger.warn('Warning message');
Logger.screenshot('Captured dealer selection');

// Log test data
Logger.testData(testData);  // Masks passwords automatically

// Create sections
Logger.section('Login Section');

// End test
Logger.endTest('PASSED');  // or 'FAILED'
```

**Output:**
```
================================================================================
🧪 TEST: TC_01_SearchDealer
⏰ START TIME: 2026-07-13 10:30:45
================================================================================

[STEP 1] Search for dealer
   🎯 ACTION: Click search button → Search
   📊 DATA: Mobile Number = 9876543210
   ✅ PASSED: Search successful
   📸 SCREENSHOT: Captured dealer selection

================================================================================
🏁 TEST END: TC_01_SearchDealer
⏰ END TIME: 2026-07-13 10:31:20
✅ STATUS: PASSED
================================================================================
```

**Log files created:** `logs/TC_01_SearchDealer_2026-07-13T10-30-45.log`

---

### **2. Screenshot with Element Highlighting**

Capture screenshots with visual indicators for better debugging.

```typescript
import { ScreenshotWithHighlight } from '../../utils';

const screenshot = new ScreenshotWithHighlight(page);

// Capture with single element highlighted (red border + shadow)
await screenshot.captureWithHighlight(
  page.locator('#dealer-dropdown'),
  'Dealer Selection',
  '#FF0000'  // Red color
);

// Capture specific element only
await screenshot.captureElement(
  page.locator('.error-message'),
  'Error Message'
);

// Capture full page
await screenshot.captureFullPage('Complete Page View');

// Highlight multiple elements (different colors)
await screenshot.captureWithMultipleHighlights(
  [
    page.locator('#field1'),
    page.locator('#field2'),
    page.locator('#field3')
  ],
  'Multiple Fields Highlighted',
  ['#FF0000', '#00FF00', '#0000FF']  // Red, Green, Blue
);

// Capture on failure with error context
try {
  // Test logic
} catch (error) {
  await screenshot.captureOnFailure('Test Failed', error);
  throw error;
}

// Add text annotation
await screenshot.addAnnotation('This is important', { x: 10, y: 10 });
await screenshot.captureFullPage('Page with annotation');
await screenshot.removeAnnotations();

// Cleanup old screenshots (keep last 7 days)
ScreenshotWithHighlight.cleanupOldScreenshots(7);
```

**Screenshots saved to:** `screenshots/`

---

### **3. Window & Tab Management**

Handle multiple browser windows and tabs easily.

```typescript
import { WindowManager } from '../../utils';

// Initialize (in test setup)
const windowManager = new WindowManager(context, page);

// Open new tab
const newTab = await windowManager.openNewTab('https://example.com', 'tab1');

// Open blank tab
const blankTab = await windowManager.openBlankTab('tab2');

// Switch between tabs
windowManager.switchToTab('tab1');
windowManager.switchToTabByIndex(0);  // Switch by position
await windowManager.switchToTabByURL('example.com');  // By URL pattern
await windowManager.switchToTabByTitle('Page Title');  // By title

// Get current page
const currentPage = windowManager.getCurrentPage();

// Handle popup windows
const popup = await windowManager.handlePopup(
  async () => {
    await page.click('#open-popup-button');
  },
  'popup1',
  10000  // timeout
);

// Execute action in specific tab and return
const result = await windowManager.executeInTab('tab1', async (page) => {
  await page.fill('#input', 'value');
  return await page.locator('.result').textContent();
});

// Get tab information
const info = await windowManager.getTabInfo('tab1');
console.log(info.title, info.url);

// Print all tabs (debugging)
await windowManager.printAllTabs();

// Close tabs
await windowManager.closeTab('tab1');
await windowManager.closeAllExcept('main');
await windowManager.closeAllTabs();

// Wait for new tab to open
const newTab = await windowManager.waitForNewTab(10000, 'auto-tab');

// Take screenshot of specific tab
await windowManager.screenshotTab('tab1', 'screenshots/tab1.png');

// Navigate tab
await windowManager.navigateTab('tab1', 'https://newurl.com');
```

---

### **4. Enhanced Data Generator**

Generate all types of test data.

```typescript
import { DataGenerator } from '../../utils';

// Mobile numbers (starts with 6, 7, or 8)
const mobile = DataGenerator.generateMobileNumber();
// Output: "9876543210"

// PAN numbers (ABCDE1234F format)
const pan = DataGenerator.generatePanNumber();
// Output: "ABCDE1234F"

// Aadhaar numbers
const aadhaar = DataGenerator.generateAadharNumber();  // 4 digits
const fullAadhaar = DataGenerator.generateFullAadharNumber();  // 12 digits

// Customer names
const name = DataGenerator.generateName('Auto');
// Output: "AutoXYZABC"

// Bank account number
const account = DataGenerator.generateAccountNumber();
// Output: "12345678901234"

// Bank account with timestamp (unique)
const uniqueAccount = DataGenerator.generateAccountNumberWithTimestamp();

// IFSC code
const ifsc = DataGenerator.generateIFSC();
// Output: "ABCD0123456"

// Deal ID (CS + 8 digits)
const dealID = DataGenerator.generateDealID();
// Output: "CS12345678"

// Card number (16 digits)

// Output: "1234567890123456"const card = DataGenerator.generateCardNumber();

// Driving License (AA0000000000000)
const license = DataGenerator.generateDrivingLicense();
// Output: "AB1234567890123"

// File barcode (3 letters + 10-12 digits)
const barcode = DataGenerator.generateFileBarcode();
// Output: "ABC1234567890"

// ECS barcode (9 digits + 1 special char)
const ecsBarcode = DataGenerator.generateECSBarcode();
// Output: "123456789@"

// Email
const email = DataGenerator.generateEmail('test.com');
// Output: "userXYZABC1720867845@test.com"

// Reference number (alphanumeric, 10 chars)
const refNo = DataGenerator.generateReferenceNumber();
// Output: "A1B2C3D4E5"

// OTP (One Time Password)
const otp = DataGenerator.generateOTP(6);
// Output: "123456"

// Amount within range
const amount = DataGenerator.generateAmount(1000, 100000);
// Output: 45678

// Percentage
const percentage = DataGenerator.generatePercentage(1, 100);
// Output: 75

// Date utilities
const today = DataGenerator.getToday('DD/MM/YYYY');
// Output: "13/07/2026"

const dob = DataGenerator.getDOBForAge(30);
// Output: "13/07/1996"

const pastDate = DataGenerator.getDateOffset(1, 2, 15);
// Output: "29/04/2025" (1 year, 2 months, 15 days ago)

const futureDate = DataGenerator.getFutureDate(0, 6, 0);
// Output: "13/01/2027" (6 months from now)

// Timestamp
const timestamp = DataGenerator.getTimestamp('full');
// Output: "2026-07-13_10-30-45"

// Unique ID
const uniqueID = DataGenerator.generateUniqueID('CUST');
// Output: "CUST_1720867845_a1b2c3"

// Mask sensitive data
const masked = DataGenerator.maskData('1234567890', 2);
// Output: "12******90"
```

---

## 📁 Project Structure

```
SFDC_POS_Playwright_TS/
├── config/
│   └── environment.config.ts              # Centralized config
├── fixtures/
│   ├── base.fixture.ts                    # Test fixtures (DI)
│   └── index.ts
├── pages/                                 # Page Object Model
│   ├── BasePage.ts                        # Base page class
│   ├── index.ts                           # Page exports
│   ├── common/
│   │   └── LoginPage.ts                   # Login/Logout
│   ├── search/
│   │   ├── DealerSearchPage.ts
│   │   └── AppStatusPage.ts
│   ├── customer-onboarding/
│   │   ├── ZipCodePage.ts
│   │   ├── MitcPage.ts
│   │   ├── KycPage.ts
│   │   ├── PoiPage.ts
│   │   └── PoaPage.ts
│   ├── product/
│   │   ├── ProductSelectionPage.ts
│   │   └── IncomeDeclarationPage.ts
│   ├── approval/
│   │   ├── SurrogateDetailsPage.ts
│   │   └── AssetCartPage.ts
│   ├── admin/
│   │   └── AdminCustomerPage.ts
│   └── fos/
│       ├── PreApprovalPage.ts
│       ├── PostApprovalPage.ts
│       └── DOIssuePage.ts
├── test-data/
│   ├── TestData.xlsx                      # Excel test data
│   └── README.md
├── tests/
│   ├── customer/                          # Customer journey (12 files)
│   │   ├── 01_searchDealer.spec.ts
│   │   ├── 02_appStatus.spec.ts
│   │   ├── 03_zipCode.spec.ts
│   │   ├── 04_mitc.spec.ts
│   │   ├── 05_panVerification.spec.ts
│   │   ├── 06_kyc.spec.ts
│   │   ├── 07_poi.spec.ts
│   │   ├── 08_poa.spec.ts
│   │   ├── 09_productSelection.spec.ts
│   │   ├── 10_incomeDeclaration.spec.ts
│   │   ├── 11_surrogateDetails.spec.ts
│   │   └── 12_assetCart.spec.ts
│   ├── admin/
│   │   └── 13_preApproval.spec.ts
│   ├── fos/
│   │   └── 14_postApproval.spec.ts
│   └── e2e/
│       ├── customer-journey.spec.ts       # Full E2E flow
│       ├── admin-approval.spec.ts
│       └── post-approval.spec.ts
├── types/
│   ├── customer.types.ts                  # TypeScript types
│   └── test-data.types.ts
├── utils/
│   ├── actions.util.ts                    # Common actions
│   ├── excel-reader.util.ts               # Excel reader
│   ├── data-generator.util.ts             # Data generation
│   ├── api.util.ts                        # API helpers
│   ├── logger.util.ts                     # Enhanced logger ⭐ NEW
│   ├── screenshot-with-highlight.util.ts  # Screenshot + highlight ⭐ NEW
│   ├── window-manager.util.ts             # Multi-window handling ⭐ NEW
│   ├── advanced-util.ts                   # Advanced utilities
│   └── index.ts                           # Utility exports
├── logs/                                  # Test execution logs ⭐ NEW
├── screenshots/                           # Test screenshots ⭐ NEW
├── reports/                               # Test reports
│   └── html/                              # HTML reports
├── .env                                   # Environment variables
├── .env.example                           # Environment template
├── .gitignore
├── package.json                           # Dependencies & scripts
├── playwright.config.ts                   # Playwright configuration
├── tsconfig.json                          # TypeScript configuration
├── setup.ps1                              # Setup script
├── validate.cjs                           # Excel validator
├── README.md                              # This file
├── HOW_TO_ADD_REMOVE_SCENARIOS.md        # Scenario management guide ⭐ NEW
├── EXCEL_DATA_REQUIREMENTS.md            # Excel data guide
├── EXCEL_TEMPLATE.md                     # Excel template
└── EXCEL_WORKFLOW_GUIDE.md               # Excel workflow
```

---

## 🔄 Regression Testing Strategy

### Test Levels

| Level | Duration | When to Run | Test Count | Command |
|-------|----------|-------------|------------|---------|
| **Smoke** | 15-20 min | Before each deployment | ~20 tests | `npm run test:smoke` |
| **Sanity** | 30-40 min | After deployment | ~40 tests | `npm test tests/customer/` |
| **Regression** | 2-3 hours | Nightly on VM | All tests (96) | `npm run test:regression` |
| **E2E** | 30-45 min | Weekly | 3 flows | `npm test tests/e2e/` |

### Test Organization

```powershell
# By Test Level
npm run test:smoke              # Critical happy path
npm run test:regression         # Full test suite
npm test tests/e2e/            # End-to-end flows

# By Module
npm test tests/customer/        # Customer journey tests
npm test tests/admin/           # Admin tests
npm test tests/fos/             # FOS tests

# By Single File
npm test tests/customer/01_searchDealer.spec.ts

# By Test Name Pattern
npx playwright test --grep "Positive"
npx playwright test --grep "Negative"
npx playwright test --grep "Search"
```

### Tagging Tests (Future Enhancement)

```typescript
// Add tags to organize tests
test.describe('01 - Search Dealer', { tag: ['@smoke', '@search', '@p0'] }, () => {
  
  test('Valid dealer search', { tag: ['@critical'] }, async ({ page }) => {
    // Test logic
  });
});

// Run by tags
npx playwright test --grep @smoke
npx playwright test --grep @p0
npx playwright test --grep-invert @slow
```

---

## 🖥️ VM/CI Configuration

### Running on Virtual Machine

#### **Option 1: Scheduled Task (Windows VM)**

```powershell
# Setup VM (one time)
npm run setup

# Create scheduled task (runs daily at 2 AM)
schtasks /create /tn "POS_Regression" /tr "cd C:\SFDC_POS_Playwright_TS && npm run test:regression" /sc daily /st 02:00

# Create scheduled task (runs every 4 hours)
schtasks /create /tn "POS_Smoke" /tr "cd C:\SFDC_POS_Playwright_TS && npm run test:smoke" /sc hourly /mo 4

# View scheduled tasks
schtasks /query /tn "POS_Regression"

# Delete scheduled task
schtasks /delete /tn "POS_Regression" /f
```

#### **Option 2: Batch Script**

Create `run-tests.bat`:

```batch
@echo off
cd /d C:\SFDC_POS_Playwright_TS

:: Pull latest code
git pull origin main

:: Install dependencies (if package.json changed)
npm install

:: Run tests
npm run test:regression

:: Generate report
npm run report

:: Optional: Copy reports to network drive
xcopy /Y /E reports\html \\network\share\pos-reports\
```

Schedule this batch file using Windows Task Scheduler.

---

### CI/CD Integration

#### **GitHub Actions**

Create `.github/workflows/regression.yml`:

```yaml
name: Regression Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:     # Manual trigger
  push:
    branches: [main]

jobs:
  test:
    runs-on: windows-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install chromium --with-deps
      
      - name: Run Smoke Tests
        run: npm run test:smoke
        continue-on-error: true
      
      - name: Run Regression Tests
        run: npm run test:regression
      
      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: reports/html/
          retention-days: 30
      
      - name: Upload Screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: screenshots/
          retention-days: 7
```

#### **Azure DevOps**

Create `azure-pipelines.yml`:

```yaml
trigger:
  - main

schedules:
  - cron: "0 2 * * *"
    displayName: Daily Regression
    branches:
      include:
        - main

pool:
  vmImage: 'windows-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '18.x'
    displayName: 'Install Node.js'

  - script: |
      npm ci
      npx playwright install chromium --with-deps
    displayName: 'Install dependencies'

  - script: npm run test:regression
    displayName: 'Run Regression Tests'
    continueOnError: true

  - task: PublishTestResults@2
    inputs:
      testResultsFormat: 'JUnit'
      testResultsFiles: '**/junit.xml'
    displayName: 'Publish Test Results'

  - task: PublishPipelineArtifact@1
    inputs:
      targetPath: 'reports/html'
      artifact: 'playwright-report'
    displayName: 'Upload Test Report'
    condition: always()
```

#### **Jenkins**

Create `Jenkinsfile`:

```groovy
pipeline {
    agent {
        label 'windows'
    }
    
    triggers {
        cron('H 2 * * *')  // Daily at 2 AM
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'your-repo-url'
            }
        }
        
        stage('Install Dependencies') {
            steps {
                bat 'npm ci'
                bat 'npx playwright install chromium --with-deps'
            }
        }
        
        stage('Run Tests') {
            steps {
                bat 'npm run test:regression'
            }
        }
        
        stage('Publish Report') {
            steps {
                publishHTML([
                    reportDir: 'reports/html',
                    reportFiles: 'index.html',
                    reportName: 'Playwright Report'
                ])
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'reports/**/*', fingerprint: true
            archiveArtifacts artifacts: 'screenshots/**/*', fingerprint: true, allowEmptyArchive: true
        }
    }
}
```

---

## 💡 Best Practices

### 1. **Test Independence**

```typescript
✅ GOOD - Each test is independent:
test.beforeEach(async ({ loginPage }) => {
  await loginPage.loginToFOS(...);  // Fresh login for each test
});

test('Test 1', async ({ dealerSearchPage }) => {
  // Test logic - doesn't depend on other tests
});

test('Test 2', async ({ dealerSearchPage }) => {
  // Test logic - doesn't depend on other tests
});

❌ BAD - Tests depend on each other:
test('Test 1', async ({ page }) => {
  await createRecord();  // Creates shared state
});

test('Test 2', async ({ page }) => {
  await useRecord();  // Depends on Test 1 - BREAKS if Test 1 fails
});
```

---

### 2. **Use Page Objects**

```typescript
✅ GOOD - Use page objects:
await dealerSearchPage.selectDealer(dealerValue);
await dealerSearchPage.searchByMobile(mobileNumber);

❌ BAD - Raw selectors in tests:
await page.locator('#dealer-dropdown').click();
await page.locator('//span[text()="Mumbai"]').click();
await page.fill('#mobile-input', '9876543210');
```

---

### 3. **Data-Driven Testing**

```typescript
✅ GOOD - Data from Excel:
const dealerValue = testData['dealervalue'];
await dealerSearchPage.selectDealer(dealerValue);

// Change data in Excel, no code change needed!

❌ BAD - Hardcoded data:
await dealerSearchPage.selectDealer('100203 - Mumbai Dealer');
// Requires code change if data changes
```

---

### 4. **Descriptive Test Names**

```typescript
✅ GOOD:
test('Positive: Search with valid dealer and mobile number', async () => {});
test('Negative: Search with invalid dealer code', async () => {});
test('Negative: Search without selecting dealer', async () => {});

❌ BAD:
test('test1', async () => {});
test('search test', async () => {});
test('it works', async () => {});
```

---

### 5. **Use test.step() for Clarity**

```typescript
✅ GOOD - Clear steps in report:
test('Complete flow', async ({ page }) => {
  await test.step('Step 1: Login', async () => {
    await loginPage.loginToFOS(...);
  });
  
  await test.step('Step 2: Search dealer', async () => {
    await dealerSearchPage.selectDealer(...);
  });
  
  await test.step('Step 3: Verify results', async () => {
    await expect(page.locator('.results')).toBeVisible();
  });
});

❌ BAD - No steps:
test('Complete flow', async ({ page }) => {
  await loginPage.loginToFOS(...);
  await dealerSearchPage.selectDealer(...);
  await expect(page.locator('.results')).toBeVisible();
  // Hard to see which step failed in report
});
```

---

### 6. **Enhanced Logging**

```typescript
✅ GOOD - Use Logger utility:
Logger.step('Search for dealer');
Logger.action('Select dealer', dealerValue);
Logger.data('Mobile Number', mobileNumber);
Logger.passed('Search successful');

❌ OKAY - Basic console.log:
console.log('Searching for dealer');
console.log('Mobile:', mobileNumber);
```

---

### 7. **Error Handling**

```typescript
✅ GOOD - Proper error handling:
try {
  await page.fill('#mobile', mobileNumber);
  await page.click('button:has-text("Search")');
  Logger.passed('Search initiated');
} catch (error) {
  Logger.failed('Search failed', error);
  await screenshot.captureOnFailure('Search Error', error);
  throw error;
}

❌ BAD - No error handling:
await page.fill('#mobile', mobileNumber);
await page.click('button:has-text("Search")');
// If error occurs, no context captured
```

---

### 8. **Smart Waits**

```typescript
✅ GOOD - Wait for specific condition:
await expect(page.locator('.results')).toBeVisible({ timeout: 30000 });
await page.waitForLoadState('networkidle');

❌ BAD - Fixed delays:
await page.waitForTimeout(5000);  // May wait too long or not long enough
```

---

### 9. **Reusable Methods**

```typescript
✅ GOOD - Reusable page object methods:
// In DealerSearchPage.ts
async searchByMobile(mobile: string): Promise<void> {
  await this.fillTextbox('Mobile Number', mobile);
  await this.clickButton('Search');
  await this.waitForResults();
}

// In test
await dealerSearchPage.searchByMobile(mobileNumber);

❌ BAD - Repeated code:
// In every test
await page.fill('#mobile', mobileNumber);
await page.click('button:has-text("Search")');
await page.waitForSelector('.results');
```

---

### 10. **File Naming Convention**

```
✅ GOOD:
tests/customer/01_searchDealer.spec.ts
tests/customer/02_appStatus.spec.ts
pages/search/DealerSearchPage.ts
pages/search/AppStatusPage.ts

❌ BAD:
tests/test1.spec.ts
tests/mytest.spec.ts
pages/page1.ts
pages/test.ts
```

---

## 🐛 Troubleshooting

### **Test Not Running?**

**Symptoms:**
- Test file not discovered
- `npm test` doesn't run your test

**Solutions:**
1. Check file name ends with `.spec.ts`
2. Check file is in `tests/` folder
3. Check Excel `executionFlag = yes`
4. Run `npm test -- --list` to see discovered tests

---

### **Test Data Not Loading?**

**Symptoms:**
- `testData['field']` returns `undefined`
- Error: "Cannot read property of undefined"

**Solutions:**
1. Verify Excel file path: `test-data/TestData.xlsx`
2. Check test case name matches (e.g., `TC_01_SearchDealer`)
3. Ensure empty row after each test block
4. Run `npm run validate` to check Excel structure
5. Check field name spelling (lowercase, no spaces)

```typescript
// Debug: Print loaded test data
console.log('Test Data:', testData);
console.log('Keys:', Object.keys(testData));
```

---

### **Page Object Not Found?**

**Symptoms:**
- Error: "Property 'dealerSearchPage' does not exist"

**Solutions:**
1. Check it's exported in `pages/index.ts`:
   ```typescript
   export * from './search/DealerSearchPage';
   ```

2. Check it's in fixtures (`fixtures/base.fixture.ts`):
   ```typescript
   dealerSearchPage: async ({ page }, use) => {
     await use(new DealerSearchPage(page));
   },
   ```

3. Verify import in test file:
   ```typescript
   import { test, expect } from '../../fixtures';
   ```

---

### **Element Not Found?**

**Symptoms:**
- Error: "Timeout 30000ms exceeded"
- Error: "Element is not visible"

**Solutions:**
1. Check selector is correct:
   ```typescript
   // Use Playwright Inspector
   npx playwright codegen https://your-app.com
   ```

2. Add explicit wait:
   ```typescript
   await expect(page.locator('#element')).toBeVisible({ timeout: 60000 });
   ```

3. Check element is in correct frame:
   ```typescript
   const frame = page.frameLocator('iframe[name="frameNameng"]');
   await frame.locator('#element').click();
   ```

4. Wait for page load:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

---

### **Tests Passing Locally But Failing on VM?**

**Symptoms:**
- Tests pass on local machine
- Same tests fail on VM/CI

**Solutions:**
1. Run in headless mode locally to replicate:
   ```powershell
   npm run test:ci
   ```

2. Increase timeouts in `playwright.config.ts`:
   ```typescript
   timeout: 10 * 60 * 1000,  // 10 minutes
   expect: { timeout: 60000 }, // 60 seconds
   ```

3. Check screen resolution (VM may have different resolution)

4. Disable animations:
   ```typescript
   await page.addStyleTag({
     content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
   });
   ```

---

### **Logs Not Created?**

**Symptoms:**
- No log files in `logs/` folder
- Logger not working

**Solutions:**
1. Initialize logger in test:
   ```typescript
   Logger.initTest('TC_01_TestName');
   ```

2. Check `logs/` folder exists (created automatically)

3. Check write permissions on `logs/` folder

---

### **Screenshots Not Captured?**

**Symptoms:**
- No screenshots in `screenshots/` folder

**Solutions:**
1. Check `screenshots/` folder exists (created automatically)

2. Initialize ScreenshotWithHighlight:
   ```typescript
   const screenshot = new ScreenshotWithHighlight(page);
   ```

3. Call capture method:
   ```typescript
   await screenshot.captureFullPage('Page View');
   ```

4. Check write permissions on `screenshots/` folder

---

### **Excel Validation Fails?**

**Symptoms:**
- `npm run validate` shows errors

**Solutions:**
1. Check empty rows between suites
2. Check no duplicate suite names
3. Check field names (lowercase, no spaces)
4. Check executionFlag values (`yes` or `no`, lowercase)

---

## 📚 Additional Documentation

- **[HOW_TO_ADD_REMOVE_SCENARIOS.md](./HOW_TO_ADD_REMOVE_SCENARIOS.md)** - Detailed guide for scenario management
- **[EXCEL_DATA_REQUIREMENTS.md](./EXCEL_DATA_REQUIREMENTS.md)** - Complete Excel structure guide
- **[EXCEL_TEMPLATE.md](./EXCEL_TEMPLATE.md)** - Excel templates for all test cases
- **[EXCEL_WORKFLOW_GUIDE.md](./EXCEL_WORKFLOW_GUIDE.md)** - Excel workflow patterns

---

## 🎓 Training & Resources

### **For New Team Members**

1. **Setup & Installation** (30 min)
   - Clone repository
   - Run `npm run setup`
   - Configure `.env` file

2. **Framework Overview** (1 hour)
   - Read this README
   - Explore project structure
   - Review sample tests in `tests/customer/`

3. **Hands-On Practice** (2 hours)
   - Run existing tests: `npm run test:ui`
   - Modify Excel data and rerun
   - Add new test case (follow [HOW_TO_ADD_REMOVE_SCENARIOS.md](./HOW_TO_ADD_REMOVE_SCENARIOS.md))

4. **Advanced Topics** (2 hours)
   - Create new page objects
   - Use enhanced utilities (Logger, Screenshot, WindowManager)
   - Debug failing tests

### **Useful Commands**

```powershell
# Explore tests interactively
npm run test:ui

# Watch tests run
npm run test:chrome

# Debug specific test
npm run test:debug -- tests/customer/01_searchDealer.spec.ts

# Generate Playwright code (record actions)
npx playwright codegen https://your-app.com

# View HTML report
npm run report

# Check Playwright version
npx playwright --version

# Update Playwright
npm install @playwright/test@latest
```

---

## 🤝 Contributing

### **Before Making Changes**

1. Pull latest code:
   ```powershell
   git pull origin main
   ```

2. Create feature branch:
   ```powershell
   git checkout -b feature/your-feature-name
   ```

3. Make changes and test locally:
   ```powershell
   npm test
   npm run test:regression
   ```

4. Commit with descriptive message:
   ```powershell
   git add .
   git commit -m "Add: New dealer search test case"
   ```

5. Push and create PR:
   ```powershell
   git push origin feature/your-feature-name
   ```

---

## 📊 Comparison with Legacy Java Selenium Framework

### **Detailed Comparison**

| Aspect | TypeScript Playwright (This) | Java Selenium (Legacy) |
|--------|------------------------------|------------------------|
| **Setup Time** | ✅ 5 minutes | ⚠️ 30+ minutes |
| **Learning Curve** | ✅ Easy (JavaScript syntax) | ⚠️ Steep (Java + TestNG) |
| **Test Execution Speed** | ✅ 10x faster | ⚠️ Slower |
| **Auto-wait** | ✅ Built-in smart waits | ❌ Manual waits needed |
| **Browser Support** | ✅ Chromium, Firefox, WebKit | ⚠️ Chrome, Firefox (limited Safari) |
| **Parallel Execution** | ✅ Built-in, easy config | ⚠️ TestNG parallel (complex) |
| **Screenshots** | ✅ Auto + highlight capability | ⚠️ Manual screenshots |
| **Videos** | ✅ Auto-recorded on failure | ❌ Not available |
| **Network Interception** | ✅ Built-in | ❌ Complex setup |
| **API Testing** | ✅ Simple fetch/axios | ⚠️ REST Assured (heavy) |
| **Test Organization** | ✅ Clean folder structure | ❌ 100+ User Story folders |
| **Documentation** | ✅ Comprehensive | ❌ Missing/outdated |
| **Add New Test** | ✅ 1 file + Excel entry | ⚠️ Multiple files + config |
| **Debugging** | ✅ VS Code debugger + UI mode | ⚠️ IntelliJ debugger |
| **IDE Support** | ✅ VS Code (free) | ⚠️ IntelliJ IDEA (paid) |
| **CI/CD Integration** | ✅ Simple GitHub Actions | ⚠️ Complex Jenkins setup |
| **Report Quality** | ✅ Rich HTML with traces | ⚠️ Basic HTML reports |
| **Dependencies** | ✅ Minimal (npm packages) | ⚠️ Many JARs to manage |
| **Error Messages** | ✅ Clear, actionable | ⚠️ Verbose stack traces |
| **Community Support** | ✅ Large, active | ⚠️ Smaller |
| **Modern Practices** | ✅ Async/await, modern JS | ⚠️ Older patterns |

### **Functionality Coverage**

| Feature | This Framework | Java Framework |
|---------|----------------|----------------|
| **Excel-driven data** | ✅ Yes | ✅ Yes |
| **Page Object Model** | ✅ Yes | ✅ Yes |
| **Data Generation** | ✅ Enhanced | ✅ Basic |
| **Logging** | ✅ Enhanced with colors | ⚠️ Basic |
| **Screenshots** | ✅ With highlighting | ⚠️ Basic |
| **API Testing** | ✅ Built-in | ✅ REST Assured |
| **Database Access** | ⚠️ Can be added | ✅ JDBC |
| **Email Notifications** | ⚠️ Can be added | ✅ SMTP |
| **Multi-window** | ✅ WindowManager | ✅ Window handling |
| **Azure DevOps** | ⚠️ Can be added | ✅ Integrated |
| **CouchDB** | ❌ Not needed | ✅ Integrated |
| **Selenium Grid** | ❌ Not needed (Playwright Grid) | ✅ Supported |

### **Code Comparison Example**

**TypeScript Playwright:**
```typescript
test('Search dealer', async ({ dealerSearchPage }) => {
  await dealerSearchPage.selectDealer(testData['dealervalue']);
  await expect(page.locator('.results')).toBeVisible();
});
```

**Java Selenium:**
```java
@Test
public void testSearchDealer(Method method) {
    TestStart(method.getName());
    for (int i = 0; i < iterationCount.size(); i++) {
        dataRowNo = parseInt(iterationCount.get(i));
        String dealerValue = retrieve("Dealer Value");
        search.selectDealer(dealerValue);
        Assert.assertTrue(isElementPresent("//div[@class='results']"));
    }
    TestEnd();
}
```

**Winner:** TypeScript Playwright (cleaner, easier to read)

---

## 📞 Support & Contact

### **Getting Help**

1. **Check Documentation First:**
   - [README.md](./README.md) (this file)
   - [HOW_TO_ADD_REMOVE_SCENARIOS.md](./HOW_TO_ADD_REMOVE_SCENARIOS.md)
   - [EXCEL_DATA_REQUIREMENTS.md](./EXCEL_DATA_REQUIREMENTS.md)

2. **Search Existing Issues:**
   - Check if someone else had the same problem

3. **Debug Locally:**
   ```powershell
   npm run test:debug -- tests/path/to/failing-test.spec.ts
   ```

4. **Create Issue:**
   - Provide test name, error message, screenshots
   - Include steps to reproduce

### **Common Questions**

**Q: How do I add a new test?**  
A: See [HOW_TO_ADD_REMOVE_SCENARIOS.md](./HOW_TO_ADD_REMOVE_SCENARIOS.md)

**Q: How do I change test data?**  
A: Edit `test-data/TestData.xlsx`, save, rerun tests

**Q: How do I disable a test temporarily?**  
A: Change `executionFlag` to `no` in Excel

**Q: How do I run tests on VM?**  
A: See [VM/CI Configuration](#%EF%B8%8F-vmci-configuration) section

**Q: How do I debug failing tests?**  
A: Run `npm run test:debug -- tests/path/to/test.spec.ts`

**Q: Can I run tests in parallel?**  
A: Yes, but current config uses 1 worker for stability. Increase in `playwright.config.ts`

**Q: How do I generate test reports?**  
A: Run `npm run report` after test execution

---

## ⭐ Key Takeaways

### **For Test Engineers**

✅ **Easy to Use** - Excel-driven, minimal coding needed  
✅ **Fast Execution** - Playwright is 10x faster than Selenium  
✅ **Clear Logs** - Enhanced logging with emojis and colors  
✅ **Visual Debugging** - Screenshots with element highlighting  
✅ **Simple Maintenance** - Change data in Excel, no code change needed  

### **For Developers**

✅ **Type-Safe** - Full TypeScript with IntelliSense  
✅ **Modern Patterns** - Async/await, fixtures, page objects  
✅ **Clean Code** - Well-organized folder structure  
✅ **Extensible** - Easy to add new utilities and helpers  
✅ **CI/CD Ready** - Simple integration with GitHub Actions, Azure DevOps  

### **For Managers**

✅ **Cost-Effective** - All tools are free (Node.js, Playwright, VS Code)  
✅ **Faster Feedback** - Tests run 10x faster than Selenium  
✅ **Easier Maintenance** - Less time spent maintaining tests  
✅ **Better Reports** - Rich HTML reports with screenshots and videos  
✅ **Scalable** - Can run on VMs, in parallel, in CI/CD pipelines  

---

## 📜 License

This project is proprietary software. All rights reserved.

---

## 🎉 Acknowledgments

- **Playwright Team** - For the amazing browser automation tool
- **TypeScript Team** - For type safety and modern JavaScript
- **Project Team** - For building and maintaining this framework

---

## 📝 Changelog

### **Version 2.0.0** (July 2026)
- ✨ Added enhanced Logger utility
- ✨ Added Screenshot with highlighting utility
- ✨ Added Window Manager utility
- ✨ Enhanced Data Generator with 15+ new generators
- ✨ Added comprehensive documentation (HOW_TO_ADD_REMOVE_SCENARIOS.md)
- ✨ Added VM/CI configuration guides
- ✨ Improved Excel validation
- ✨ Added comparison with legacy Java Selenium framework
- 🐛 Fixed Excel reader for multi-dataset support
- 📚 Updated all documentation

### **Version 1.0.0** (Initial Release)
- 🎉 Initial framework with 96 tests
- ✅ Page Object Model implementation
- ✅ Excel-driven test data
- ✅ Fixture pattern for dependency injection
- ✅ Basic utilities (Actions, DataGenerator, ExcelReader)
- ✅ HTML reporting

---

**Made with ❤️ by the Automation Team**

---

**🚀 Ready to start? Run `npm run setup` and begin testing!**
