import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { DataGenerator } from '../../utils';

/**
 * Pre-Approval Page Object
 * Handles dealer search, zip code verification, MITC, product selection, income declaration, and KYC flows
 */
export class PreApprovalPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Error Handling ====================

  /**
   * Check for application errors and fail if found
   */
  async checkForErrorAndFail(): Promise<void> {
    await this.actions.checkForErrors();
  }

  /**
   * Check for errors and continue (for non-critical errors)
   */
  async checkForErrorAndContinue(): Promise<void> {
    const errorSelectors = [
      '.slds-notify_toast',
      '.error',
      '.toastMessage',
      '.slds-has-error',
      '.forceActionsText'
    ];
    const successKeywords = ['success', 'successfully', 'record updated', 'saved', 'completed', 'created', 'updated'];
    const errorKeywords = ['error', 'failed', 'exception', 'unable', 'invalid', 'required', 'denied'];

    for (const selector of errorSelectors) {
      const element = this.page.locator(selector).first();
      const visible = await element.isVisible().catch(() => false);
      
      if (visible) {
        const text = (await element.textContent() || '').trim().toLowerCase();
        console.log(`Popup/Message detected: ${text}`);
        
        if (successKeywords.some(k => text.includes(k))) {
          console.log('Success message detected. Continuing...');
          continue;
        }
        
        if (errorKeywords.some(k => text.includes(k))) {
          await this.page.screenshot({ path: `error-popup-${Date.now()}.png`, fullPage: true });
          console.log(`Error popup detected: ${text}`);
        }
      }
    }
    console.log('No error popup/message found');
  }

  // ==================== Common Methods ====================

  /**
   * Enter text into textbox by label
   */
  async enterTextToTextbox(label: string, value: string): Promise<void> {
    const textbox = this.page.getByRole('textbox', { name: label });
    await textbox.click();
    await textbox.fill(value);
    await textbox.press('Tab');
    await expect(textbox).toHaveValue(value);
    console.log(`✓ Entered ${value} into ${label}`);
  }

  /**
   * Enter text using XPath label selector
   */
  async enterText(label: string, value: string): Promise<void> {
    await this.actions.fill(
      this.page.locator(`//label[text()='${label}']//..//input`),
      value,
      `Enter ${label}`
    );
    console.log(`✓ Entered ${value} into ${label}`);
    await this.waitFor(1000);
  }

  /**
   * Get current page/screen name value
   */
  async getPageNameValue(expectedValue: string): Promise<string> {
    console.log('===== Get Current Screen Value =====');
    const text = await this.page.locator("//div[@class='currentScreen']").innerText();
    console.log(`Actual Page: ${text} | Expected: ${expectedValue}`);
    return text;
  }

  /**
   * Click on menu item tab
   */
  async clickOnTab(label: string): Promise<void> {
    console.log('===== Click on Menu Tab =====');
    await this.actions.click(
      this.page.locator(`//a[@role='menuitem']//span[contains(text(), '${label}')]`),
      `Click ${label} tab`
    );
    console.log(`✓ Clicked on Tab: ${label}`);
  }

  /**
   * Lookup value in table/dropdown
   */
  async lookupValueInTable(label: string, value: string): Promise<void> {
    const locatorLabel = this.page.getByRole('textbox', { name: label });
    await locatorLabel.click();
    await locatorLabel.press('Control+A');
    await locatorLabel.press('Backspace');
    await this.page.keyboard.insertText(value);
    await locatorLabel.press('Backspace');
    console.log(`✓ Entered ${value} into ${label}`);
    await this.actions.click(this.page.getByText(value), `Select ${value}`);
    console.log(`✓ Selected ${value} from ${label}`);
  }

  /**
   * Select radio button by value
   */
  async selectRadioButton(value: string): Promise<void> {
    await this.actions.click(
      this.page.locator(`//div//div//label//input[@value='${value}']//../span//span[@class='slds-radio_faux']`),
      `Select ${value}`
    );
  }

  /**
   * Select dropdown value using XPath
   */
  async selectDropdownValue(label: string, value: string): Promise<void> {
    const dropdown = this.page.locator(`//div//h1[text()='${label}']//..//select`);
    await dropdown.selectOption({ value });
    console.log(`✓ Selected ${value} from ${label}`);
  }

  // ==================== Pre-Approval Flow Methods ====================

  /**
   * Select dealer and enter mobile number
   */
  async selectDealerAndMobileNumber(
    dealerValue: string,
    mobileNumberLabel: string,
    mobileNumber: string,
    searchButton: string
  ): Promise<void> {
    console.log('===== Select Dealer & Enter Mobile Number =====');
    await this.clickOnTab(searchButton);
    await this.actions.click(this.page.getByRole('combobox', { name: 'Dealer' }), 'Open dealer dropdown');
    await this.actions.click(this.page.getByTitle(dealerValue), 'Select Dealer');
    console.log(`✓ Selected ${dealerValue} from Dealer`);
    await this.enterText(mobileNumberLabel, mobileNumber);
    console.log(`✓ Entered ${mobileNumber} into ${mobileNumberLabel}`);
    await this.clickButton(searchButton);
    console.log(`✓ Clicked on button: ${searchButton}`);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Proceed through app status page
   */
  async proceedAppStatusPage(expectedValue: string, proceedButtonValue: string): Promise<void> {
    console.log('===== Proceed App Status Page =====');
    await this.getPageNameValue(expectedValue);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Enter zip code value with lookup
   */
  async enterZipCodeValue(label: string, value: string): Promise<void> {
    const locatorLabel = this.page.getByRole('textbox', { name: label });
    await locatorLabel.click();
    await locatorLabel.press('Control+A');
    await locatorLabel.press('Backspace');
    await locatorLabel.press('411014 ', { delay: 100 });
    console.log(`✓ Entered ${value} into ${label}`);
    await this.actions.click(this.page.getByText(value), `Select ${value}`);
    console.log(`✓ Selected ${value} from ${label}`);
  }

  /**
   * Enter date of birth in date field
   */
  async enterDateOfBirth(labelName: string, dateValue: string): Promise<void> {
    const selector = `xpath=//input[@placeholder='Enter Date Of Birth ']`;
    const dateInput = this.page.locator(selector);
    await dateInput.waitFor({ state: 'visible', timeout: 10000 });
    await dateInput.scrollIntoViewIfNeeded();
    
    const [day, month, year] = dateValue.split('-');
    await dateInput.focus();
    await dateInput.press(day);
    await dateInput.press(month);
    await dateInput.press(year);
    console.log(`✓ Entered ${dateValue} into ${labelName}`);
  }

  /**
   * Enter zip code verification page details
   */
  async enterZipCodeVerificationDetails(
    expectedValue: string,
    zipCodeLabel: string,
    zipCodeValue: string,
    bflBranchLabel: string,
    bflBranchValue: string,
    dobLabel: string,
    dobValue: string,
    genderLabel: string,
    genderValue: string,
    preferredLanguageLabel: string,
    preferredLanguageValue: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Enter ZipCode Verification Details =====');
    await this.getPageNameValue(expectedValue);
    await this.enterZipCodeValue(zipCodeLabel, zipCodeValue);
    await this.lookupValueInTable(bflBranchLabel, bflBranchValue);
    await this.enterDateOfBirth(dobLabel, dobValue);
    
    await this.actions.click(this.page.getByRole('combobox', { name: genderLabel }), 'Open gender dropdown');
    await this.actions.click(this.page.locator(`//span[text()='${genderValue}']`), 'Select Gender');
    console.log(`✓ Selected ${genderValue} from Gender`);
    
    await this.actions.click(this.page.getByRole('combobox', { name: preferredLanguageLabel }), 'Open language dropdown');
    await this.actions.click(this.page.getByTitle(preferredLanguageValue), 'Select Language');
    console.log(`✓ Selected ${preferredLanguageValue} from Preferred Communication Language`);
    
    await this.clickButton(proceedButtonValue);
    await this.checkForErrorAndFail();
    await this.waitFor(10000);
  }

  /**
   * Enter MITC details
   */
  async enterMitcDetails(firstName: string, lastName: string, proceedButtonValue: string): Promise<void> {
    console.log('===== Enter MITC Details =====');
    await this.getPageNameValue('MITC');
    await this.actions.fill(this.page.locator("//label[text()='First Name ']//..//input"), firstName, 'Enter First Name');
    console.log(`✓ Entered ${firstName} into First Name`);
    await this.actions.fill(this.page.locator("//label[text()='Last Name']//..//input"), lastName, 'Enter Last Name');
    console.log(`✓ Entered ${lastName} into Last Name`);
    await this.clickButton(proceedButtonValue);
    await this.checkForErrorAndFail();
    await this.waitFor(3000);
  }

  /**
   * Select model and scheme in product selection page
   */
  async selectModelAndScheme(
    expectedValue: string,
    productName: string,
    modelName: string,
    invoiceAmountLabel: string,
    invoiceAmountValue: string,
    loanAmountLabel: string,
    loanAmountValue: string,
    proceedButtonValue: string,
    schemeName: string,
    confirmButtonValue: string
  ): Promise<void> {
    console.log('===== Enter Model & Select Scheme in Product Selection =====');
    await this.waitFor(1500);
    await this.actions.click(this.page.getByText('No', { exact: true }), 'Click No');
    await this.waitFor(1000);
    await this.actions.click(this.page.getByText('Enter Manually', { exact: true }), 'Click Enter Manually');
    await this.waitFor(1000);
    await this.getPageNameValue(expectedValue);
    await this.lookupValueInTable(productName, modelName);
    await this.enterText(invoiceAmountLabel, invoiceAmountValue);
    await this.enterText(loanAmountLabel, loanAmountValue);
    await this.actions.click(this.page.locator("//span[@class='slds-checkbox_faux']"), 'Check checkbox');
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
    await this.actions.click(this.page.getByText(schemeName, { exact: true }), `Select ${schemeName}`);
    console.log(`✓ Selected ${schemeName} from Scheme Name`);
    await this.clickButton(confirmButtonValue);
    await this.waitFor(10000);
    await this.checkForErrorAndFail();
  }

  /**
   * Enter income declaration details
   */
  async enterIncomeDeclarationDetails(
    expectedValue: string,
    incomeValue: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Enter Income in Income Declaration Page =====');
    await this.getPageNameValue(expectedValue);
    await this.actions.fill(this.page.locator('input.field-box:visible'), incomeValue, 'Enter Income');
    console.log(`✓ Entered ${incomeValue} into Income Declaration`);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Select KYC dropdown option
   */
  async selectKYCDropdown(
    expectedValue: string,
    kycOptionValue: string,
    saveButtonValue: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Complete the E-KYC Details =====');
    await this.getPageNameValue(expectedValue);
    await this.selectRadioButton('e-kyc');
    await this.clickButton('Initiate');
    await this.clickButton('Mobile');
    await this.waitFor(1000);
    
    const dropdown = this.page.locator('select:has-text("Select Bypass Reason")');
    await dropdown.selectOption({ value: kycOptionValue });
    console.log(`✓ Selected ${kycOptionValue} from Bypass Reason`);
    
    await this.clickButton(saveButtonValue);
    await this.waitFor(1000);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Select digilocker dropdown option
   */
  async selectDigilockerDropdown(
    expectedValue: string,
    kycOptionValue: string,
    saveButtonValue: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Complete the Digilocker Details =====');
    await this.getPageNameValue(expectedValue);
    await this.selectRadioButton('digilocker');
    await this.clickButton('Initiate');
    await this.waitFor(1000);
    
    const dropdown = this.page.locator('select:has-text("Select Bypass Reason")');
    await dropdown.selectOption({ value: kycOptionValue });
    console.log(`✓ Selected ${kycOptionValue} from Bypass Reason`);
    
    await this.clickButton(saveButtonValue);
    await this.waitFor(1000);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Enter POI details
   */
  async enterPOIDetails(
    expectedValue: string,
    firstName: string,
    lastName: string,
    poiTypeValue: string,
    poiNumber: string,
    employmentTypeValue: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Enter POI Details in POI Page =====');
    await this.getPageNameValue(expectedValue);
    await this.enterTextToTextbox('First Name', firstName);
    await this.enterTextToTextbox('Middle Name', '');
    await this.enterTextToTextbox('Last Name', lastName);
    await this.selectDropdownValue('POI Type', poiTypeValue);
    await this.enterTextToTextbox('POI Number', poiNumber);
    await this.selectDropdownValue('Employment Type', employmentTypeValue);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Enter POA details
   */
  async enterPOADetails(
    expectedValue: string,
    proceedButtonValue: string,
    residenceTypeValue: string,
    poaTypeValue: string,
    poaNumber: string
  ): Promise<void> {
    console.log('===== Enter POA Details in POA Page =====');
    await this.getPageNameValue(expectedValue);
    await this.selectRadioButton('manual');
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.selectDropdownValue('Residence Type', residenceTypeValue);
    await this.enterTextToTextbox('Address Line 1', DataGenerator.generateName());
    await this.enterTextToTextbox('Address Line 2', DataGenerator.generateName());
    await this.enterTextToTextbox('Address Line 3', DataGenerator.generateName());
    await this.enterTextToTextbox('Area Locality', DataGenerator.generateName());
    await this.enterTextToTextbox('Landmark', DataGenerator.generateName());
    
    const dropdown = this.page.locator("//div//label[text()='POA Type']//..//select");
    await dropdown.selectOption({ value: poaTypeValue });
    console.log(`✓ Selected ${poaTypeValue} from POA Type`);
    
    await this.enterTextToTextbox('POA Number', poaNumber);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Select surrogate details
   */
  async selectSurrogateDetails(
    expectedValue: string,
    creditProgramValue: string,
    checkApprovalButton: string
  ): Promise<void> {
    console.log('===== Complete the Surrogate Details =====');
    await this.getPageNameValue(expectedValue);
    await this.selectDropdownValue('Credit Program', creditProgramValue);
    await this.clickButton(checkApprovalButton);
    await this.waitFor(10000);
    await this.checkForErrorAndFail();
    await this.page.reload();
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  // ==================== Verification Methods ====================

  /**
   * Verify header is displayed
   */
  async verifyHeaderIsDisplayed(label: string): Promise<boolean> {
    try {
      const header = this.page.locator(`//div[text()='${label}']`);
      await expect(header).toBeVisible({ timeout: 10000 });
      await header.scrollIntoViewIfNeeded();
      console.log(`✓ ${label} header is displayed`);
      return true;
    } catch (error) {
      console.error(`Failed to verify header "${label}"`);
      return false;
    }
  }

  /**
   * Verify sub-header is displayed
   */
  async verifySubHeaderIsDisplayed(label: string): Promise<boolean> {
    try {
      const element = this.page.locator(`//*[text()='${label}']`);
      await element.waitFor({ state: 'visible', timeout: 10000 });
      await element.scrollIntoViewIfNeeded();
      console.log(`✓ Expected text "${label}" is present`);
      return true;
    } catch (error) {
      console.error(`Expected text "${label}" not found`);
      return false;
    }
  }

  /**
   * Click on hamburger menu option
   */
  async clickOnHamburgerMenu(optionToClick: string): Promise<void> {
    try {
      await this.page.locator("//button[@class='breadcrumb-button']").click();
      const option = this.page.locator(`//a/span[text()='${optionToClick}'] | //button[text()='${optionToClick}']`);
      
      if (await option.isVisible()) {
        await option.click();
        console.log(`✓ Clicked '${optionToClick}' successfully`);
      } else {
        console.log(`'${optionToClick}' option not found`);
      }
    } catch (error) {
      console.error(`Failed to click '${optionToClick}'`);
      throw error;
    }
  }

  /**
   * Enter OTP digits
   */
  async enterOTP(label: string, value: string): Promise<void> {
    try {
      const inputs = this.page.locator(`xpath=//div/lightning-formatted-text[text()='${label}']/parent::div//input`);
      const count = await inputs.count();
      
      for (let i = 0; i < Math.min(count, value.length); i++) {
        await inputs.nth(i).fill(value[i]);
      }
    } catch (error: any) {
      throw new Error(`Failed to enter value in ${label}. ERROR: ${error.message}`);
    }
  }
}
