# 📊 Excel Data Management Guide

**Complete Guide for Test Data Management**  
**File:** `test-data/TestData.xlsx`

---

## 📑 Table of Contents

1. [Excel Structure](#excel-structure)
2. [Sheet 1: TestSuites](#sheet-1-testsuites)
3. [Sheet 2: TestData](#sheet-2-testdata)
4. [Data Requirements](#data-requirements)
5. [Adding New Test Data](#adding-new-test-data)
6. [Common Test Data Fields](#common-test-data-fields)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## 📋 Excel Structure

The framework uses **2 sheets** in `TestData.xlsx`:

```
TestData.xlsx
├── Sheet 1: TestSuites  → Which tests to run
└── Sheet 2: TestData    → Test data for each test
```

---

## 📝 Sheet 1: TestSuites

**Purpose:** Control which test suites to execute

### Structure

| Column | Description | Example |
|--------|-------------|---------|
| `SpecFile` | Test file name (without .spec.ts) | `customer-journey` |
| `Description` | Test description | `New customer application flow` |
| `Tags` | Test tags (comma-separated) | `smoke,e2e` |
| `Environment` | Target environment | `QA` |
| `ExecutionFlag` | Run this test? | `yes` or `no` |

### Example

| SpecFile | Description | Tags | Environment | ExecutionFlag |
|----------|-------------|------|-------------|---------------|
| customer-journey | New customer application flow | smoke,e2e | QA | yes |
| admin-approval | Admin approval workflow | admin | QA | yes |
| post-approval | Post approval flow | approval | QA | no |

### Usage

- Set `ExecutionFlag` to `yes` to run the test
- Set `ExecutionFlag` to `no` to skip the test
- Use `Tags` for filtering tests by category

---

## 📊 Sheet 2: TestData

**Purpose:** Store test data for each test suite

### Structure Format

```
TC_##_test-suite-name
Header Row with Column Names
Data Row 1
Data Row 2 (optional - for data-driven tests)
[Blank Row]
TC_##_next-test-suite
...
```

### Example

```excel
TC_01_E2E_SanityUIFlow
Environment | ExecutionFlag | APPURLCUSTOMERLOGIN | USERNAMECUSTOMERLOGIN | PASSWORDCUSTOMERLOGIN
QA          | yes          | https://example.com | testuser             | testpass123

TC_02_admin-approval
Environment | ExecutionFlag | APPURLADMIN | USERNAMEADMIN | PASSWORDADMIN
QA          | yes          | https://admin.example.com | admin | adminpass123

TC_03_post-approval
Environment | ExecutionFlag | APPURLCUSTOMERLOGIN | USERNAMECUSTOMERLOGIN
QA          | yes          | https://example.com | testuser
```

### Important Rules

✅ **DO:**
- Start each test suite with `TC_##_` prefix
- Use the exact test file name after `TC_##_` (e.g., `TC_01_customer-journey`)
- Include `Environment` and `ExecutionFlag` columns
- Use UPPERCASE for column names (they will be converted to camelCase in code)
- Leave blank rows between different test suites

❌ **DON'T:**
- Use spaces in column names (use UPPERCASE_WITH_UNDERSCORES)
- Change the `TC_##_` naming pattern
- Delete the header row
- Mix data from different test suites

---

## 🔧 Data Requirements

### Required Columns (All Tests)

| Column Name | Description | Example |
|-------------|-------------|---------|
| `Environment` | Test environment | `QA`, `UAT`, `PROD` |
| `ExecutionFlag` | Execute this row? | `yes` or `no` |

### Customer Journey Test Data

**Login Credentials:**
- `APPURLCUSTOMERLOGIN` - FOS URL
- `USERNAMECUSTOMERLOGIN` - FOS username
- `PASSWORDCUSTOMERLOGIN` - FOS password
- `FOSLOGINBUTTON` - Login button text (default: "Log in")

**Dealer Search:**
- `DEALERVALUE` - Dealer name/code
- `MOBILENUMBERLABEL` - Mobile field label
- `SEARCHBUTTON` - Search button text

**App Status:**
- `APPSTATUSPAGENAME` - Page name/title
- `PROCEEDBUTTONVALUE` - Proceed button text

**Zip Code Details:**
- `ZIPCODELABEL` - Zip code field label
- `ZIPCODEVALUE` - Zip code with city (e.g., "411014 Pune")
- `BFLBRANCHVALUE` - BFL branch selection
- `DOBVALUE` - Date of birth (format: "DD-MM-YYYY")
- `GENDERVALUE` - Gender selection
- `PREFERREDCOMMUNICATIONLANGUAGEVALUE` - Communication language
- `PREFERREDLANGUAGEVALUE` - Preferred language
- `POAADDRESSTYPE` - POA address type

**KYC Details:**
- `KYCPAGENAME` - KYC page name
- `KYCOPTIONVALUE` - KYC option selection
- `SAVEBUTTONVALUE` - Save button text

**POI (Proof of Identity):**
- `POIPAGENAME` - POI page name
- `POITYPEVALUE` - POI document type (e.g., "Aadhaar", "PAN")
- `EMPLOYMENTTYPEVALUE` - Employment type (e.g., "Salaried")

**POA (Proof of Address):**
- `POAPAGENAME` - POA page name
- `RESIDENCETYPEVALUE` - Residence type (e.g., "Owned", "Rented")
- `POATYPEVALUE` - POA document type

**Product Selection:**
- `PRODUCTSECTIONPAGENAME` - Product page name
- `CATEGORYVALUE` - Product category (e.g., "Mobile")
- `MANUFACTURERVALUE` - Manufacturer name
- `MODELNAMEVALUE` - Model name
- `MODELVARIANTVALUE` - Model variant (e.g., "128GB")
- `MODELCOLORVALUE` - Model color
- `INVOICEAMOUNTVALUE` - Unit price
- `QUANTITYVALUE` - Quantity
- `CONFIRMBUTTONVALUE` - Confirm button text

**Income Declaration:**
- `INCOMEDECLARATIONPAGENAME` - Income page name
- `INCOMEAMOUNTVALUE` - Income amount
- `INCOMESOURCEVALUE` - Income source

**Surrogate Details:**
- `SURROGATEDETAILSPAGENAME` - Surrogate page name
- `SURROGATETYPEVALUE` - Surrogate type (e.g., "Bank Statement")
- `SURROGATEVALUE` - Bank name or surrogate value
- `SUBMITBUTTONVALUE` - Submit button text

**Asset Cart:**
- `ASSETCARTPAGENAME` - Asset cart page name

### Admin Test Data

- `APPURLADMIN` - Admin portal URL
- `USERNAMEADMIN` - Admin username
- `PASSWORDADMIN` - Admin password

---

## ➕ Adding New Test Data

### Method 1: Add New Suite

1. **Open TestData.xlsx**
2. **Go to Sheet 2 (TestData)**
3. **Find the end of existing data**
4. **Add blank row**
5. **Add new test case header:**
   ```
   TC_04_my-new-test
   ```
6. **Add column headers (row below):**
   ```
   Environment | ExecutionFlag | FIELD1 | FIELD2 | ...
   ```
7. **Add data row:**
   ```
   QA | yes | value1 | value2 | ...
   ```
8. **Save file**

### Method 2: Add Data Row to Existing Suite

1. **Open TestData.xlsx**
2. **Find the test suite (e.g., `TC_01_E2E_SanityUIFlow`)**
3. **Add new row below existing data**
4. **Fill in data matching the column headers**
5. **Save file**

### Example: Adding New E2E Test Data

```excel
TC_01_E2E_SanityUIFlow
Environment | ExecutionFlag | APPURLCUSTOMERLOGIN | USERNAMECUSTOMERLOGIN | PASSWORDCUSTOMERLOGIN | DEALERVALUE
QA          | yes          | https://qa.example.com | user1 | pass1 | Dealer A
UAT         | yes          | https://uat.example.com | user2 | pass2 | Dealer B  ← NEW ROW
```

---

## 📋 Common Test Data Fields

### Page Names
These are usually page titles or headers visible in the UI:

- `APPSTATUSPAGENAME` → "App Status"
- `KYCPAGENAME` → "KYC"
- `POIPAGENAME` → "POI"
- `POAPAGENAME` → "POA"
- `PRODUCTSECTIONPAGENAME` → "Product Selection"

### Button Text
Common button labels in the application:

- `PROCEEDBUTTONVALUE` → "Proceed"
- `SAVEBUTTONVALUE` → "Save"
- `CONFIRMBUTTONVALUE` → "Confirm"
- `SUBMITBUTTONVALUE` → "Submit"
- `SEARCHBUTTON` → "Search"

### Dropdown Values
Values to select from dropdowns:

- `GENDERVALUE` → "Male", "Female", "Other"
- `EMPLOYMENTTYPEVALUE` → "Salaried", "Self-employed"
- `RESIDENCETYPEVALUE` → "Owned", "Rented", "Parental"
- `CATEGORYVALUE` → "Mobile", "Laptop", "Appliance"

---

## ✅ Best Practices

### 1. **Naming Conventions**
- Use UPPERCASE for all column names
- Use underscores for multi-word names (e.g., `MOBILE_NUMBER`)
- Be consistent with naming across all tests

### 2. **Data Organization**
- Keep related data together
- Use blank rows to separate test suites
- Add comments in unused columns if needed

### 3. **Test Data Values**
- Use realistic values that match the application
- Don't hardcode sensitive data (passwords should be in .env)
- Use descriptive values for debugging

### 4. **Environment-Specific Data**
- Use different rows for different environments (QA, UAT, PROD)
- Control execution with `ExecutionFlag`

### 5. **Data Reusability**
- Create multiple data rows for data-driven testing
- Use the same column structure across environments

---

## 🔍 Column Name Conversion

**Excel (UPPERCASE)** → **Code (camelCase)**

| Excel Column | Code Variable |
|--------------|---------------|
| `APPURLCUSTOMERLOGIN` | `appurlcustomerlogin` |
| `USERNAMECUSTOMERLOGIN` | `usernamecustomerlogin` |
| `PASSWORDCUSTOMERLOGIN` | `passwordcustomerlogin` |
| `DEALER_VALUE` | `dealer_value` |
| `ZIP_CODE` | `zip_code` |

**In Test Code:**
```typescript
// Access data in tests
testData['appurlcustomerlogin']  // from APPURLCUSTOMERLOGIN
testData['usernamecustomerlogin'] // from USERNAMECUSTOMERLOGIN
testData['zipcodevalue']          // from ZIPCODEVALUE
```

---

## 🚨 Troubleshooting

### Issue: "Test data not found for test case"

**Cause:** Test suite name doesn't match Excel

**Solution:**
1. Check Sheet 2 for `TC_##_test-name`
2. Ensure name matches the spec file name
3. Example: For `customer-journey.spec.ts`, use `TC_01_customer-journey`

### Issue: "Column not found in test data"

**Cause:** Column name in Excel doesn't match code

**Solution:**
1. Check column name in Excel (e.g., `APPURLCUSTOMERLOGIN`)
2. In code, use lowercase: `testData['appurlcustomerlogin']`
3. Excel columns are auto-converted to lowercase

### Issue: "ExecutionFlag not working"

**Cause:** Value is not exactly "yes" or "no"

**Solution:**
1. Check for extra spaces: `"yes "` should be `"yes"`
2. Check case: `"Yes"` should be `"yes"`
3. Use exactly: `yes` or `no` (lowercase)

### Issue: "Data from wrong environment"

**Cause:** Multiple rows with same environment

**Solution:**
1. Framework takes FIRST matching row
2. Use different `Environment` values (QA, UAT, PROD)
3. Or use `ExecutionFlag=no` to skip unwanted rows

### Issue: "Special characters not working"

**Cause:** Excel auto-formatting

**Solution:**
1. Format cells as TEXT before entering data
2. For URLs, passwords with special chars, use TEXT format
3. For numbers with leading zeros, use TEXT format

---

## 📦 Environment Variables Alternative

Instead of Excel, you can use `.env` file:

```bash
# .env
FOS_URL=https://example.com
FOS_USERNAME=testuser
FOS_PASSWORD=testpass
ADMIN_URL=https://admin.example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=adminpass
```

**Fallback Priority:**
1. Excel data (if available)
2. Environment variables (from .env)
3. Default values (in code)

---

## 🔗 Related Documentation

- [README.md](./README.md) - Complete framework guide
- [HOW_TO_ADD_REMOVE_SCENARIOS.md](./HOW_TO_ADD_REMOVE_SCENARIOS.md) - Scenario management
- [TEST_SCENARIOS_MASTER.md](./TEST_SCENARIOS_MASTER.md) - All test scenarios documented

---

## 📞 Support

For Excel data issues:
1. Check this guide first
2. Review [Troubleshooting](#troubleshooting) section
3. Validate Excel structure matches [Sheet 2 format](#sheet-2-testdata)
4. Check column naming conventions

---

**Last Updated:** July 14, 2026  
**Version:** 2.0.0
