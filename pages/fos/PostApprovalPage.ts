import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { DataGenerator } from '../../utils';

/**
 * Post-Approval Page Object
 * Handles additional information, personal details, and asset cart flows
 */
export class PostApprovalPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Error Handling ====================

  async checkForErrorAndFail(): Promise<void> {
    await this.actions.checkForErrors();
  }

  async checkForErrorAndContinue(): Promise<void> {
    const errorSelectors = ['.slds-notify_toast', '.error', '.toastMessage', '.slds-has-error', '.forceActionsText'];
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

  async enterTextToTextbox(label: string, value: string): Promise<void> {
    const textbox = this.page.getByRole('textbox', { name: label });
    await textbox.click();
    await textbox.fill(value);
    await textbox.press('Tab');
    console.log(`✓ Entered ${value} into ${label}`);
  }

  async getPageNameValue(expectedValue: string): Promise<string> {
    console.log('===== Get Current Screen Value =====');
    const text = await this.page.locator("//div[@class='currentScreen']").innerText();
    console.log(`Actual Page: ${text} | Expected: ${expectedValue}`);
    return text;
  }

  async lookupValueInTable(label: string, value: string): Promise<void> {
    const locatorLabel = this.page.getByRole('textbox', { name: label });
    await locatorLabel.click();
    await locatorLabel.press('Control+A');
    await locatorLabel.press('Backspace');
    await this.page.keyboard.insertText(value);
    await locatorLabel.press('Backspace');
    console.log(`✓ Entered ${value} into ${label}`);
    await this.actions.click(
      this.page.locator(`//div[@class='slds-box']//..//li[text()='${value}']`),
      `Select ${value}`
    );
    console.log(`✓ Selected ${value} from ${label}`);
  }

  async selectDropdownValue(label: string, value: string): Promise<void> {
    const dropdown = this.page.locator(`//div//h1[text()='${label}']//..//select`);
    await dropdown.selectOption({ value });
    console.log(`✓ Selected ${value} from ${label}`);
  }

  async enterOfficePinCodeValue(label: string, value: string): Promise<void> {
    const locatorLabel = this.page.getByRole('textbox', { name: label });
    await locatorLabel.click();
    await locatorLabel.press('Control+A');
    await locatorLabel.press('Backspace');
    await locatorLabel.press('411014 ', { delay: 100 });
    await locatorLabel.press('Backspace');
    console.log(`✓ Entered ${value} into ${label}`);
    await this.actions.click(this.page.getByText(value), `Select ${value}`);
    console.log(`✓ Selected ${value} from ${label}`);
  }

  // ==================== Post-Approval Flow Methods ====================

  /**
   * Enter additional information details
   */
  async enterAdditionalDetails(
    expectedValue: string,
    officePinCodeLabel: string,
    officePinCodeValue: string,
    nameOfCompanyLabel: string,
    nameOfCompanyValue: string,
    officePhoneNumberTypeValue: string,
    designationValue: string,
    monthlyIncomeValue: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Enter Additional Information Details =====');
    await this.getPageNameValue(expectedValue);
    await this.enterOfficePinCodeValue(officePinCodeLabel, officePinCodeValue);
    await this.lookupValueInTable(nameOfCompanyLabel, nameOfCompanyValue);
    await this.enterTextToTextbox('Office Address Line 1', DataGenerator.generateName());
    await this.enterTextToTextbox('Office Address Line 2', DataGenerator.generateName());
    await this.enterTextToTextbox('Office Address Line 3', DataGenerator.generateName());
    await this.enterTextToTextbox('Office Area Locality', DataGenerator.generateName());
    await this.selectDropdownValue('Office Phone Number Type', officePhoneNumberTypeValue);
    await this.enterTextToTextbox('Office Mobile Number', DataGenerator.generateMobileNumber());
    await this.selectDropdownValue('Designation', designationValue);
    await this.selectDropdownValue('Monthly Income', monthlyIncomeValue);
    await this.enterTextToTextbox('Name on Card', DataGenerator.generateName());
    
    await this.actions.click(this.page.locator("//button[@class='proceedBtn']"), 'Click Proceed');
    console.log(`✓ Clicked on button: ${proceedButtonValue}`);
    await this.waitFor(2000);
    await this.checkForErrorAndFail();
  }

  /**
   * Enter personal information details
   */
  async enterPersonalDetails(
    expectedValue: string,
    fatherNameLabel: string,
    motherNameLabel: string,
    alternatePhoneLabel: string,
    preferredLanguageValue: string,
    maritalStatusValue: string,
    qualificationValue: string,
    preferredMailingAddressValue: string,
    continueButtonLabel: string
  ): Promise<void> {
    console.log('===== Enter Personal Information Details =====');
    await this.getPageNameValue(expectedValue);
    await this.actions.fill(this.page.locator(`[name="${fatherNameLabel}"]`), DataGenerator.generateName(), 'Enter Father Name');
    await this.actions.fill(this.page.locator(`[name="${motherNameLabel}"]`), DataGenerator.generateName(), 'Enter Mother Name');
    await this.enterTextToTextbox(alternatePhoneLabel, DataGenerator.generateMobileNumber());
    await this.selectDropdownValue('Preferred Language', preferredLanguageValue);
    await this.selectDropdownValue('Marital Status', maritalStatusValue);
    await this.selectDropdownValue('Qualification', qualificationValue);
    await this.selectDropdownValue('Preferred Mailing Address', preferredMailingAddressValue);
    
    const dropdown = this.page.locator("//div//label[text()='Time horizon for next purchase']//..//select");
    await dropdown.selectOption({ value: 'Never' });
    console.log(`✓ Selected {Never} from {Time horizon for next purchase}`);
    
    await this.actions.click(this.page.locator("//button[@class='proceedBtn']"), 'Click Proceed');
    console.log(`✓ Clicked on button: ${continueButtonLabel}`);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Get opportunity ID value
   */
  async getOpportunityValue(expectedValue: string): Promise<string> {
    console.log('===== Get Opportunity Id Value =====');
    await this.getPageNameValue(expectedValue);
    const text = await this.page.locator("//h3[text()='Asset Cart']//..//div[@class='card-container']//..//div[@class='oppNumber']").innerText();
    console.log(`Opportunity ID: ${text}`);
    return text;
  }

  /**
   * Enter opportunity into search textbox
   */
  async enterOpportunityIntoSearchTextbox(label: string, value: string): Promise<void> {
    console.log('===== Search Opportunity Id Value =====');
    await this.actions.fill(
      this.page.locator("//div[@data-aura-class='uiInput uiAutocomplete uiInput--default']//input[@placeholder='Search...']"),
      value,
      'Enter search value'
    );
    console.log(`✓ Entered ${value} into ${label}`);
    await this.actions.click(
      this.page.locator(`//div//ul//li//a[@role='option']//div[@class='slds-truncate']//span[@title='${value}']`),
      `Select ${value}`
    );
    console.log(`✓ Selected ${value} from search results`);
    await this.checkForErrorAndFail();
    await this.waitFor(10000);
  }
}
