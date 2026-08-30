import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { DataGenerator } from '../../utils';

/**
 * DO Issue Page Object
 * Handles cross-sell, EMI card, loan summary, and banking sections
 */
export class DOIssuePage extends BasePage {
  private accountNumber: string;

  constructor(page: Page) {
    super(page);
    this.accountNumber = DataGenerator.generateAccountNumber();
  }

  // ==================== Error Handling ====================

  async checkForErrorAndFail(): Promise<void> {
    await this.actions.checkForErrors();
  }

  // ==================== Common Methods ====================

  async getPageNameValue(expectedValue: string): Promise<string> {
    console.log('===== Get Current Screen Value =====');
    const text = await this.page.locator("//div[@class='currentScreen']").innerText();
    console.log(`Actual Page: ${text} | Expected: ${expectedValue}`);
    return text;
  }

  async enterTextToTextbox(label: string, value: string): Promise<void> {
    await this.actions.fill(this.page.getByRole('textbox', { name: label }), value, `Enter ${label}`);
    console.log(`✓ Entered ${value} into ${label}`);
  }

  async lookupValueInTable(label: string, value: string): Promise<void> {
    await this.enterTextToTextbox(label, value);
    await this.actions.click(
      this.page.locator(`//div[@class='slds-dropdown slds-dropdown_length-with-icon-7 slds-dropdown_fluid']//..//li[text()='${value}']`),
      `Select ${value}`
    );
    console.log(`✓ Selected ${value} from ${label}`);
  }

  // ==================== DO Issue Flow Methods ====================

  /**
   * Proceed through cross-sell section
   */
  async proceedCrossSellSection(expectedValue: string, proceedButtonValue: string): Promise<void> {
    console.log('===== Proceed Cross Sell Section =====');
    await this.waitFor(15000);
    await this.getPageNameValue(expectedValue);
    await this.actions.click(this.page.locator("//button[@class='breadcrumb-button']"), 'Click breadcrumb');
    await this.actions.click(
      this.page.locator("//div[@class='hamburger-menu']//div//button[text()='Loan Summary']"),
      'Click Loan Summary'
    );
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Proceed through EMI card section
   */
  async proceedEMICardSection(expectedValue: string, proceedButtonValue: string): Promise<void> {
    console.log('===== Proceed EMI Card Section =====');
    await this.getPageNameValue(expectedValue);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Proceed through loan summary section
   */
  async proceedLoanSummarySection(expectedValue: string, confirmButtonValue: string): Promise<void> {
    console.log('===== Proceed Loan Summary Section =====');
    await this.getPageNameValue(expectedValue);
    await this.clickButton(confirmButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Enter bank details in banking section
   */
  async enterBankDetailsInBankSection(
    expectedValue: string,
    bankNameLabel: string,
    bankNameValue: string,
    accountTypeLabel: string,
    accountTypeValue: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Enter Banking Details & Complete Banking Section =====');
    await this.getPageNameValue(expectedValue);
    await this.lookupValueInTable(bankNameLabel, bankNameValue);
    
    // Enter account number
    const accountNumberTextbox = this.page.locator('input[type="password"]');
    await accountNumberTextbox.click();
    // Type account number with delay to simulate user input
    await accountNumberTextbox.press(this.accountNumber, { delay: 200 });
    await accountNumberTextbox.press('Tab');
    await expect(accountNumberTextbox).toHaveValue(this.accountNumber);
    console.log(`✓ Entered ${this.accountNumber} into Account Number field`);
    
    // Select account type
    await this.actions.click(this.page.getByRole('combobox', { name: accountTypeLabel }), 'Open account type dropdown');
    await this.actions.click(this.page.getByTitle(accountTypeValue), 'Select Account Type');
    console.log(`✓ Selected ${accountTypeValue} from ${accountTypeLabel}`);
    
    // Re-enter account number
    const reenterAccountNumber = this.page.locator("//h2[text()='Re-enter Account Number']//..//div//h1//..//input");
    await reenterAccountNumber.click();
    await reenterAccountNumber.press(this.accountNumber, { delay: 200 });
    await reenterAccountNumber.press('Tab');
    await expect(reenterAccountNumber).toHaveValue(this.accountNumber);
    console.log(`✓ Entered ${this.accountNumber} into Re-Account Number field`);
    
    // Log API responses
    this.page.on('response', async (res) => { console.log('API:', res.url(), res.status()); });
    
    await this.clickButton(proceedButtonValue);
    console.log('Clicked on Proceed Button');
    
    // Wait for validate button
    const validateBtn = this.page.locator("//button[text()='Validate']");
    await expect(validateBtn).toBeVisible({ timeout: 500000 });
    await validateBtn.scrollIntoViewIfNeeded();
    await validateBtn.click({ force: true });
    console.log('✓ Clicked on Validate Button');
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }
}
