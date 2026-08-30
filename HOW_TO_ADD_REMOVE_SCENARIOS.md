# 📋 How to Add/Remove Test Scenarios

## Quick Reference Guide for Managing Test Automation

---

## 🎯 **Adding a New Test Scenario**

### **Method 1: Add New Spec File (Recommended for New Features)**

#### **Step 1: Create Test File**

Navigate to appropriate folder and create new spec file:

```bash
# For customer flow tests
tests/customer/15_newFeature.spec.ts

# For admin tests
tests/admin/16_newFeature.spec.ts

# For E2E flows
tests/e2e/new-e2e-flow.spec.ts
```

#### **Step 2: Copy Template Structure**

```typescript
import { test, expect } from '../../fixtures';
import { ExcelReader, DataGenerator, Logger } from '../../utils';
import { config } from '../../config/environment.config';

test.describe('15 - New Feature Name', () => {
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

  test('Positive: Valid scenario', async ({ page, /* pageObjects */ }) => {
    Logger.step('Perform action');
    
    await test.step('Step 1: Do something', async () => {
      // Your test logic here
      Logger.passed('Step 1 completed');
    });

    await test.step('Step 2: Verify result', async () => {
      // Verification logic
      Logger.passed('Step 2 completed');
    });
  });

  test('Negative: Invalid scenario', async ({ page }) => {
    // Negative test logic
  });

  test.afterAll(async () => {
    Logger.endTest('PASSED');
  });
});
```

#### **Step 3: Add Excel Test Data**

Open `test-data/TestData.xlsx`:

1. **Sheet: TestData**
   - Add new block after empty row:
   ```
   TC_15_NewFeature
   executionFlag              yes
   environment                PREPROD
   appurlcustomerlogin       https://your-url.com
   usernamecustomerlogin     user@company.com
   passwordcustomerlogin     Password@123
   fieldName1                value1
   fieldName2                value2
   
   [EMPTY ROW]
   ```

2. **Sheet: TestSuites** (if exists)
   ```
   TC_15_NewFeature | New Feature Description | smoke | PREPROD | yes
   ```

#### **Step 4: Create Page Object (if needed)**

If new UI pages are involved:

```typescript
// pages/feature/NewFeaturePage.ts
import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

export class NewFeaturePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Locators
  private get submitButton() {
    return this.button('Submit');
  }

  private get resultMessage() {
    return this.page.locator('.result-message');
  }

  // Methods
  async performAction(data: string): Promise<void> {
    await this.actions.fill(this.textbox('Input Field'), data);
    await this.clickButton('Submit');
  }

  async verifyResult(expected: string): Promise<void> {
    await this.actions.verifyText(this.resultMessage, expected);
  }
}
```

Update `pages/index.ts`:

```typescript
export * from './feature/NewFeaturePage';
```

Update `fixtures/base.fixture.ts`:

```typescript
import { NewFeaturePage } from '../pages';

export interface PageObjects {
  // ... existing pages
  newFeaturePage: NewFeaturePage;
}

export const test = base.extend<PageObjects>({
  // ... existing fixtures
  
  newFeaturePage: async ({ page }, use) => {
    await use(new NewFeaturePage(page));
  },
});
```

#### **Step 5: Run Your New Test**

```powershell
# Run single test
npm test tests/customer/15_newFeature.spec.ts

# Run with headed mode to see execution
npm run test:chrome -- tests/customer/15_newFeature.spec.ts

# Debug mode
npm run test:debug -- tests/customer/15_newFeature.spec.ts
```

---

### **Method 2: Add Test Case to Existing Spec File**

If the test belongs to an existing feature:

#### **Step 1: Add Test Case**

```typescript
// tests/customer/01_searchDealer.spec.ts

test('Positive: New search scenario', async ({ dealerSearchPage }) => {
  await test.step('Perform new search logic', async () => {
    // Your logic
  });
});
```

#### **Step 2: Add Data to Excel**

Add fields to existing data block in `TestData.xlsx`:

```
TC_01_SearchDealer
executionFlag              yes
environment                PREPROD
... existing fields ...
newField1                  newValue1
newField2                  newValue2
```

---

## ❌ **Removing a Test Scenario**

### **Method 1: Disable in Excel (Recommended - No Code Change)**

**Best for:** Temporarily disabling tests, regression control

1. Open `test-data/TestData.xlsx`
2. Find your test case block (e.g., `TC_05_PanVerification`)
3. Change `executionFlag` from `yes` to `no`:
   ```
   TC_05_PanVerification
   executionFlag              no    ← Change this
   environment                PREPROD
   ...
   ```
4. Save Excel file
5. Run tests - this test will be skipped

✅ **Advantages:**
- No code changes needed
- Easy to re-enable later
- Good for environment-specific exclusions
- Useful for regression test selection

---

### **Method 2: Skip Test in Code**

**Best for:** Temporarily disabling while keeping code

```typescript
test.skip('This test is temporarily disabled', async ({ page }) => {
  // Test code remains but won't run
});

// Or skip entire describe block
test.describe.skip('01 - Search Dealer', () => {
  // All tests in this block are skipped
});
```

---

### **Method 3: Delete Files (Permanent)**

**Best for:** Removing obsolete functionality

#### **Steps:**

1. **Delete spec file:**
   ```powershell
   # Delete the test file
   Remove-Item tests/customer/05_panVerification.spec.ts
   ```

2. **Remove Excel data:**
   - Open `test-data/TestData.xlsx`
   - Delete the entire test case block (including empty row separator)

3. **Remove page objects (if no longer needed):**
   ```powershell
   Remove-Item pages/customer-onboarding/PanPage.ts
   ```

4. **Update exports:**
   - Remove from `pages/index.ts`
   - Remove from `fixtures/base.fixture.ts` if it was added

5. **Verify no references:**
   ```powershell
   # Search for references in codebase
   code --search "PanPage" --exclude "**/node_modules/**"
   ```

---

## 🔄 **Modifying Existing Tests**

### **Change Test Data Only**

**No code changes needed!**

1. Open `test-data/TestData.xlsx`
2. Find test case (e.g., `TC_01_SearchDealer`)
3. Modify values:
   ```
   TC_01_SearchDealer
   executionFlag              yes
   environment                PREPROD
   dealervalue               NEW_DEALER_VALUE  ← Change this
   mobilenumberlabel         Mobile Number
   ```
4. Save and run tests - new data is automatically loaded

---

### **Change Test Logic**

1. Open spec file (e.g., `tests/customer/01_searchDealer.spec.ts`)
2. Modify test steps:
   ```typescript
   test('Modified scenario', async ({ dealerSearchPage }) => {
     // Add new logic
     await dealerSearchPage.newMethod();
     
     // Modify existing logic
     await dealerSearchPage.selectDealer(testData['newField']);
   });
   ```
3. If UI changed, update page object:
   ```typescript
   // pages/search/DealerSearchPage.ts
   async newMethod(): Promise<void> {
     // New method logic
   }
   ```

---

### **Add Validation Steps**

```typescript
await test.step('Verify new requirement', async () => {
  Logger.step('Verify new field appears');
  await expect(page.locator('.new-field')).toBeVisible();
  Logger.passed('New field visible');
});
```

---

## 📊 **Organizing Tests for Regression**

### **Tagging Tests**

Add tags to organize tests:

```typescript
test.describe('01 - Search Dealer', { tag: ['@smoke', '@search', '@p0'] }, () => {
  
  test('Critical path', { tag: ['@critical'] }, async ({ page }) => {
    // Test logic
  });

  test('Edge case', { tag: ['@edge-case', '@p1'] }, async ({ page }) => {
    // Test logic
  });
});
```

### **Running Tagged Tests**

```powershell
# Run smoke tests only
npx playwright test --grep @smoke

# Run P0 tests
npx playwright test --grep @p0

# Exclude slow tests
npx playwright test --grep-invert @slow
```

---

## 🎯 **Best Practices**

### **1. Test Naming Convention**

```
✅ GOOD:
tests/customer/01_searchDealer.spec.ts
tests/admin/13_preApproval.spec.ts
tests/e2e/customer-journey.spec.ts

❌ BAD:
tests/test1.spec.ts
tests/mytest.spec.ts
tests/new.spec.ts
```

### **2. Excel Data Organization**

```
✅ GOOD - Clear blocks with separators:
TC_01_SearchDealer
field1    value1
field2    value2
          ← EMPTY ROW

TC_02_AppStatus
field1    value1

❌ BAD - No separators:
TC_01_SearchDealer
field1    value1
TC_02_AppStatus  ← NO EMPTY ROW
field1    value1
```

### **3. Test Independence**

```typescript
✅ GOOD - Each test is independent:
test.beforeEach(async ({ loginPage }) => {
  await loginPage.loginToFOS(...);  // Fresh login each test
});

❌ BAD - Tests depend on each other:
test('Test 1', async () => {
  await createRecord();  // Creates state
});
test('Test 2', async () => {
  await useRecord();  // Depends on Test 1
});
```

### **4. Use Page Objects**

```typescript
✅ GOOD - Use page objects:
await dealerSearchPage.selectDealer(testData['dealervalue']);

❌ BAD - Raw selectors in tests:
await page.locator('#dealer-dropdown').click();
await page.locator('//span[text()="Mumbai"]').click();
```

### **5. Descriptive Logging**

```typescript
✅ GOOD - Clear logs:
Logger.step('Fill customer details');
Logger.action('Enter mobile number', mobileNumber);
Logger.passed('Customer details filled successfully');

❌ BAD - No logging:
await fillForm(data);
```

---

## 🔍 **Quick Troubleshooting**

### **Test Not Running?**

1. Check Excel `executionFlag` = `yes`
2. Check file name matches pattern `*.spec.ts`
3. Check import statements are correct
4. Run: `npm test -- --list` to see discovered tests

### **Test Data Not Loading?**

1. Verify Excel file path: `test-data/TestData.xlsx`
2. Check test case name matches (e.g., `TC_01_SearchDealer`)
3. Ensure empty row after each test block
4. Run: `npm run validate` to check Excel structure

### **Page Object Not Found?**

1. Check it's exported in `pages/index.ts`
2. Check it's added to fixtures in `fixtures/base.fixture.ts`
3. Verify import statement in test file

---

## 📝 **Templates**

### **Simple Test Template**

```typescript
import { test, expect } from '../../fixtures';
import { ExcelReader, Logger } from '../../utils';

test.describe('Feature Name', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testData = excelReader.getTestDataForTestCase('TC_##_Name');
  });

  test('Test case description', async ({ page }) => {
    // Your test logic
  });
});
```

### **E2E Flow Template**

```typescript
import { test } from '../../fixtures';
import { ExcelReader, Logger } from '../../utils';

test.describe('E2E: Complete Flow', () => {
  let testData: Record<string, string>;

  test.beforeAll(async () => {
    const excelReader = new ExcelReader();
    testData = excelReader.getTestDataForTestCase('TC_E2E_Flow');
    Logger.initTest('E2E Complete Flow');
  });

  test('Complete customer journey', async ({
    loginPage,
    dealerSearchPage,
    // ... all required pages
  }) => {
    await test.step('Step 1: Login', async () => {
      Logger.step('Login to application');
      await loginPage.loginToFOS(...);
      Logger.passed('Login successful');
    });

    await test.step('Step 2: Search', async () => {
      Logger.step('Search for dealer');
      await dealerSearchPage.selectDealer(testData['dealer']);
      Logger.passed('Dealer selected');
    });

    // ... more steps
  });

  test.afterAll(async () => {
    Logger.endTest('PASSED');
  });
});
```

---

## 🚀 **Summary Commands**

```powershell
# Add new test
npm test tests/path/to/newTest.spec.ts

# Run single suite
npm test tests/customer/

# Run with UI
npm run test:ui

# Debug
npm run test:debug -- tests/path/to/test.spec.ts

# Check what tests will run
npm test -- --list

# Validate Excel structure
npm run validate
```

---

## ✅ **Checklist for Adding Tests**

- [ ] Created spec file in appropriate folder
- [ ] Added test data to Excel (TestData sheet)
- [ ] Added test suite entry (TestSuites sheet, if exists)
- [ ] Created page object (if new UI pages involved)
- [ ] Updated exports (`pages/index.ts`, `fixtures/base.fixture.ts`)
- [ ] Added logging statements
- [ ] Added test.step() for each major action
- [ ] Added appropriate tags (@smoke, @regression, etc.)
- [ ] Tested locally with `npm run test:chrome`
- [ ] Verified Excel data loads correctly
- [ ] Added comments/documentation in code

---

## ✅ **Checklist for Removing Tests**

- [ ] Set `executionFlag = no` in Excel (soft delete)
- [ ] OR deleted spec file (hard delete)
- [ ] Removed test data from Excel
- [ ] Removed page objects (if obsolete)
- [ ] Updated exports
- [ ] Searched codebase for references
- [ ] Verified tests still run without errors
- [ ] Updated documentation

---

**Need Help?**
- Review existing tests in `tests/customer/` for examples
- Check `README.md` for framework overview
- Run `npm run test:ui` to explore tests interactively
