import { test, expect } from '../../fixtures';
import { ExcelReader, getTestCaseNameFromFile } from '../../utils/excel-reader.util';
import { DataGenerator } from '../../utils/data-generator.util';
import type { ZipCodeData, PoiData, PoaData, ProductData } from '../../types/customer.types';

// Get test case name from file path
const testCaseName = getTestCaseNameFromFile(import.meta.url);

// Initialize Excel reader
const excelReader = new ExcelReader();

// You can override the test case name to match your Excel suite names
// For example: 'TC_01_E2E_SanityUIFlow' or any suite name from your Excel file
const excelSuiteName = process.env.EXCEL_SUITE_NAME || 'TC_01_E2E_SanityUIFlow';

test.describe('Customer Journey - New Application', () => {
  // Test data variables
  let testData: Record<string, string>;
  let mobileNumber: string;

  test.beforeAll(async () => {
    // Load test data from Excel
    testData = excelReader.getTestDataForTestCase(excelSuiteName);
    mobileNumber = DataGenerator.generateMobileNumber();
    console.log(`Test: ${testCaseName}`);
    console.log(`Excel Suite: ${excelSuiteName}`);
    console.log(`Mobile: ${mobileNumber}`);
    console.log(`Test Data:`, testData);
  });

  test('TC-01: Complete new customer application flow', async ({
    loginPage,
    dealerSearchPage,
    appStatusPage,
    zipCodePage,
    mitcPage,
    kycPage,
    poiPage,
    poaPage,
    productSelectionPage,
    incomeDeclarationPage,
    surrogateDetailsPage,
    assetCartPage,
  }) => {
    // ===== Step 1: Login to FOS =====
    await test.step('Login to FOS', async () => {
      await loginPage.loginToFOS(
        testData['appurlcustomerlogin'] || process.env.FOS_URL!,
        testData['usernamecustomerlogin'] || process.env.FOS_USERNAME!,
        testData['passwordcustomerlogin'] || process.env.FOS_PASSWORD!,
        testData['fosloginbutton'] || 'Log in'
      );
    });

    // ===== Step 2: Search with Mobile Number =====
    await test.step('Dealer Search', async () => {
      await dealerSearchPage.selectDealerAndSearch(
        testData['dealervalue'] || 'Test Dealer',
        testData['mobilenumberlabel'] || 'Mobile Number',
        mobileNumber,
        testData['searchbutton'] || 'Search'
      );
    });

    // ===== Step 3: App Status Page =====
    await test.step('Proceed from App Status', async () => {
      await appStatusPage.proceedFromAppStatus(
        testData['appstatuspagename'] || 'App Status',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    // ===== Step 4: Zip Code Verification =====
    await test.step('Fill Zip Code Details', async () => {
      const zipCodeData: ZipCodeData = {
        zipCode: testData['zipcodelabel'] || 'Enter Customer ZipCode',
        zipCodeValue: testData['zipcodevalue'] || '411014 Pune',
        bflBranch: testData['bflbranchvalue'] || '411014-Manual Testing Pune',
        dob: testData['dobvalue'] || '18-12-1996',
        gender: testData['gendervalue'] || 'Male',
        language: testData['preferredcommunicationlanguagevalue'] || 'English',
        preferredLanguage: testData['preferredlanguagevalue'] || 'HINDI',
        poaAddressType: testData['poaaddresstype'],
      };
      await zipCodePage.fillZipCodeDetails(zipCodeData);
      await zipCodePage.proceed(testData['proceedbuttonvalue'] || 'Proceed');
    });

    // ===== Step 5: MITC Page =====
    await test.step('Fill MITC Details', async () => {
      const firstName = DataGenerator.generateName();
      const lastName = DataGenerator.generateName();
      await mitcPage.fillMitcDetails(
        firstName,
        lastName,
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    // ===== Step 6: E-KYC Page =====
    await test.step('Complete E-KYC', async () => {
      await kycPage.selectEKyc(
        testData['kycpagename'] || 'KYC',
        testData['kycoptionvalue'] || "Customer doesn't have one of the listed Document types",
        testData['savebuttonvalue'] || 'Save',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    // ===== Step 7: POI Page =====
    await test.step('Fill POI Details', async () => {
      const poiData: PoiData = {
        firstName: DataGenerator.generateName(),
        middleName: '',
        lastName: DataGenerator.generateName(),
        poiType: testData['poitypevalue'] || 'Aadhaar',
        poiNumber: DataGenerator.generateFullAadharNumber(),
        employmentType: testData['employmenttypevalue'] || 'Salaried',
      };
      await poiPage.fillPoiDetails(
        testData['poipagename'] || 'POI',
        poiData,
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    // ===== Step 8: POA Page =====
    await test.step('Fill POA Details', async () => {
      const poaData: PoaData = {
        residenceType: testData['residencetypevalue'] || 'Owned',
        addressLine1: DataGenerator.generateName(),
        addressLine2: DataGenerator.generateName(),
        addressLine3: DataGenerator.generateName(),
        areaLocality: DataGenerator.generateName(),
        landmark: DataGenerator.generateName(),
        poaType: testData['poatypevalue'] || 'Aadhaar',
        poaNumber: DataGenerator.generateFullAadharNumber(),
      };
      await poaPage.fillPoaDetails(
        testData['poapagename'] || 'POA',
        poaData,
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    // ===== Step 9: Product Selection =====
    await test.step('Select Product', async () => {
      await productSelectionPage.selectProductCategory(
        testData['productsectionpagename'] || 'Product Selection',
        testData['categoryvalue'] || 'Mobile',
        testData['proceedbuttonvalue'] || 'Proceed'
      );

      const productData: ProductData = {
        manufacturer: testData['manufacturervalue'] || 'Samsung',
        modelName: testData['modelnamevalue'] || 'Samsung S25 Ultra',
        modelVariant: testData['modelvariantvalue'] || '128GB',
        modelColor: testData['modelcolorvalue'] || 'Black',
        unitPrice: testData['invoiceamountvalue'] || '70000',
        quantity: testData['quantityvalue'] || '1',
      };
      await productSelectionPage.fillProductDetails(
        testData['productsectionpagename'] || 'Product Selection',
        productData,
        testData['confirmbuttonvalue'] || 'Confirm'
      );
    });

    // ===== Step 10: Income Declaration =====
    await test.step('Fill Income Declaration', async () => {
      await incomeDeclarationPage.fillIncomeDeclaration(
        testData['incomedeclarationpagename'] || 'Income Declaration',
        testData['incomeamountvalue'] || '70000',
        testData['incomesourcevalue'] || 'Salary',
        testData['proceedbuttonvalue'] || 'Proceed'
      );
    });

    // ===== Step 11: Surrogate Details =====
    await test.step('Fill Surrogate Details', async () => {
      await surrogateDetailsPage.fillSurrogateDetails(
        testData['surrogatedetailspagename'] || 'Surrogate Details',
        testData['surrogatetypevalue'] || 'Bank Statement',
        testData['surrogatevalue'] || 'ICICI',
        testData['submitbuttonvalue'] || 'Submit'
      );
    });

    // ===== Step 12: Asset Cart - Get Opportunity =====
    let opportunityId: string;
    await test.step('Get Opportunity from Asset Cart', async () => {
      opportunityId = await assetCartPage.getOpportunity(
        testData['assetcartpagename'] || 'Asset Cart'
      );
      console.log(`Opportunity ID: ${opportunityId}`);
      expect(opportunityId).toBeTruthy();
    });

    // ===== Step 13: Logout =====
    await test.step('Logout from FOS', async () => {
      await loginPage.logoutFromFOS();
    });

    console.log('✓ Test completed successfully');
  });
});
