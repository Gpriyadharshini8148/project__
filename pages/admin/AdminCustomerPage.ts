import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import path from 'path';

/**
 * Admin Customer Page Object
 * Handles admin backend operations for customer management
 */
export class AdminCustomerPage extends BasePage {
  private customIframe: string;

  constructor(page: Page) {
    super(page);
    this.customIframe = '//iframe[contains(@title,"Custom Label") or contains(@title,"User")]';
  }

  // ==================== Common Methods ====================

  async enterValueInTextField(label: string, value: string): Promise<void> {
    await this.actions.fill(
      this.page.locator("//input[@type='search' and @autocomplete='off']"),
      value,
      `Entering search value: ${value}`
    );
    console.log(`✓ Entered ${value} into ${label}`);
  }

  async enterText(label: string, value: string): Promise<void> {
    await this.actions.fill(
      this.page.locator(`//label[text()='${label}']//..//input`),
      value,
      `Enter ${label}`
    );
    console.log(`✓ Entered ${value} into ${label}`);
  }

  // ==================== Search Methods ====================

  /**
   * Search for mobile number and open customer page
   */
  async searchValueInSearchField(
    searchLabel: string,
    searchFieldLabel: string,
    searchFieldValue: string
  ): Promise<void> {
    console.log('===== Search Mobile Number & Open Customer Page =====');
    await this.clickButton(searchLabel);
    await this.enterValueInTextField(searchFieldLabel, searchFieldValue);
    await this.actions.click(
      this.page.locator("//lightning-formatted-rich-text//span[contains(text(),'Show more results')]"),
      'Click Show more results'
    );
    await this.waitFor(1000);
    await this.page.reload();
    await this.waitFor(1000);
    await this.page.reload();
    await this.waitFor(1000);
    await this.actions.click(
      this.page.locator("//span[text()='First Name']//following::tbody//tr//th//span//a"),
      'Click on customer'
    );
    await this.waitFor(10000);
    console.log(`✓ Navigated to ${searchFieldValue}`);
  }

  /**
   * Search customer by deal ID
   */
  async searchByDealId(dealId: string): Promise<void> {
    console.log('===== Admin Customer Search =====');
    await this.actions.click(
      this.page.getByRole('link', { name: 'Opportunities' }),
      'Click Opportunities'
    );
    await this.waitFor(3000);

    const searchBox = this.page.getByRole('searchbox', { name: 'Search this list...' });
    await searchBox.click();
    await searchBox.fill(dealId);
    await searchBox.press('Enter');
    await this.waitFor(3000);
    console.log(`✓ Searched for deal: ${dealId}`);
  }

  /**
   * Search for opportunity in search field
   */
  async searchOpportunityValueInSearchField(
    searchLabel: string,
    searchFieldLabel: string,
    searchFieldValue: string
  ): Promise<void> {
    console.log('===== Search Opportunity Id in Search Field =====');
    await this.clickButton(searchLabel);
    await this.enterValueInTextField(searchFieldLabel, searchFieldValue);
    await this.actions.click(
      this.page.locator("//lightning-formatted-rich-text//span[contains(text(),'Show more results')]"),
      'Click Show more results'
    );
    await this.waitFor(1000);
    await this.page.reload();
    await this.waitFor(1000);
    await this.page.reload();
    await this.waitFor(1000);
    await this.actions.click(
      this.page.locator("//span[text()='Opportunity Name']//following::tbody//tr//th//span//a"),
      'Click on opportunity'
    );
    await this.waitFor(10000);
    console.log(`✓ Navigated to ${searchFieldValue}`);
  }

  /**
   * Open customer record
   */
  async openCustomerRecord(customerName: string): Promise<void> {
    await this.actions.click(
      this.page.getByRole('link', { name: customerName }),
      `Open ${customerName}`
    );
    await this.waitFor(2000);
    console.log(`✓ Opened customer: ${customerName}`);
  }

  // ==================== Edit Methods ====================

  /**
   * Check mobile validation checkbox
   */
  async checkMobileValidation(editMobileLabel: string, saveLabel: string): Promise<void> {
    await this.clickButton(editMobileLabel);
    const checkbox = this.page.locator("//label//span[text()='Is Mobile Validated']//..//..//span[@part='input-checkbox']//input[@type='checkbox']");
    
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
      console.log('Checkbox checked');
    } else {
      console.log('Checkbox already checked');
    }
    
    await this.clickButton(saveLabel);
    await this.waitFor(10000);
  }

  /**
   * Change record type
   */
  async changeRecordType(): Promise<void> {
    await this.page.reload();
    await this.waitFor(1000);
    await this.actions.click(
      this.page.locator('button').filter({ hasText: 'Change Record Type' }).last(),
      'Click Change Record Type'
    );
    await this.waitFor(1000);
    await this.actions.click(
      this.page.locator("//label[@for='0121t000000MMgSAAW']//span[@class='slds-radio--faux']"),
      'Select record type'
    );
    await this.clickButton('Next');
    await this.waitFor(1000);
    await this.actions.click(this.page.getByText('Save', { exact: true }), 'Click Save');
    await this.waitFor(10000);

    // Edit underwriting status
    await this.actions.click(
      this.page.locator('button').filter({ hasText: 'Edit Underwriting Status' }).last(),
      'Edit Underwriting Status'
    );
    await this.actions.click(this.page.getByRole('combobox', { name: 'Underwriting Status' }), 'Open dropdown');
    await this.actions.click(
      this.page.locator("//label[text()='Underwriting Status']//..//..//span[text()='Completed']"),
      'Select Completed'
    );
    console.log('✓ Selected Completed from Underwriting Status');

    await this.actions.click(this.page.getByRole('combobox', { name: 'CD Line Status' }), 'Open dropdown');
    await this.actions.click(
      this.page.locator("//label[text()='CD Line Status']//..//..//span[text()='Approved']"),
      'Select Approved'
    );
    console.log('✓ Selected Approved from CD Line Status');
    await this.enterText('CD Line', '900000');

    await this.actions.click(this.page.getByRole('combobox', { name: 'CD App Line Status' }), 'Open dropdown');
    await this.actions.click(
      this.page.locator("//label[text()='CD App Line Status']//..//..//span[text()='Approved']"),
      'Select Approved'
    );
    console.log('✓ Selected Approved from CD App Line Status');
    await this.enterText('CD Appliance Line', '900000');

    await this.actions.click(this.page.getByRole('combobox', { name: 'Digital Line Status' }), 'Open dropdown');
    await this.actions.click(
      this.page.locator("//label[text()='Digital Line Status']//..//..//span[text()='Approved']"),
      'Select Approved'
    );
    console.log('✓ Selected Approved from Digital Line Status');
    await this.enterText('Digital Line', '900000');

    await this.clickButton('Save');
    await this.waitFor(10000);
  }

  /**
   * Approve customer application
   */
  async approveApplication(approveButton: string = 'Approve'): Promise<void> {
    console.log('===== Approve Application =====');
    await this.clickButton(approveButton);
    await this.waitFor(2000);
    await this.checkForErrors();
    console.log('✓ Application approved');
  }

  /**
   * Reject customer application
   */
  async rejectApplication(rejectButton: string = 'Reject', reason: string): Promise<void> {
    console.log('===== Reject Application =====');
    await this.clickButton(rejectButton);
    await this.waitFor(1000);
    await this.fillTextbox('Rejection Reason', reason);
    await this.clickButton('Submit');
    await this.waitFor(2000);
    await this.checkForErrors();
    console.log(`✓ Application rejected: ${reason}`);
  }

  // ==================== Upload Methods ====================

  /**
   * Upload files to required documents
   */
  async uploadFiles(label: string, fileName: string): Promise<void> {
    try {
      await this.actions.click(
        this.page.locator('span').filter({ hasText: 'Required Documents' }).first(),
        'Click Required Documents'
      );
      await this.actions.click(
        this.page.locator(`//table//tr//th//span[text()='Required Documents Name']//following::tr//th//span[text()='${label}']`),
        `Click ${label}`
      );
      await this.waitFor(1000);
      await this.actions.click(
        this.page.locator('span').filter({ hasText: 'Files' }).first(),
        'Click Files'
      );
      await this.waitFor(200);
      await this.actions.click(this.page.getByText('Add Files').nth(0), 'Click Add Files');
      await this.waitFor(100);
      await this.actions.click(
        this.page.locator("//span[text()='client_logo']//..//..//label//span[@class='slds-checkbox_faux']").last(),
        'Select file'
      );
      await this.waitFor(100);
      await this.page.getByRole('button', { name: 'Add (1)' }).click({ force: true });
      console.log(`✓ Uploaded ${fileName} file in ${label} Document`);
      await this.waitFor(1000);

      await this.page.goBack();

      // Update status
      await this.clickButton('Edit Status');
      await this.actions.click(this.page.locator("//label[text()='Status']//..//..//button"), 'Open status dropdown');
      await this.actions.click(
        this.page.locator("//label[text()='Underwriting Status']//..//..//span[text()='Received']"),
        'Select Received'
      );
      console.log('✓ Selected Received from Status');
      await this.clickButton('Save');
      await this.waitFor(10000);

      await this.page.goBack();
    } catch (error: any) {
      console.error(`Failed in uploadfiles: ${error.message}`);
    }
  }

  /**
   * Upload documents in required document section
   */
  async uploadDocumentsInRequiredDocument(poiLabel: string, fileName: string): Promise<void> {
    console.log('===== Upload Document From Backend Required Document Section =====');
    await this.uploadFiles(poiLabel, fileName);
    await this.uploadFiles(poiLabel, fileName);
    await this.uploadFiles(poiLabel, fileName);
    console.log('✓ Uploaded Customer Photo, POI & POA Documents from Required Document Section');

    await this.uploadFiles(poiLabel, fileName);
    await this.uploadFiles(poiLabel, fileName);
    await this.uploadFiles(poiLabel, fileName);
    console.log('✓ Uploaded Key Fact Statement, Opp Application Form & LTS/Cross Sell Documents');
  }

  // ==================== Navigation Methods ====================

  /**
   * Click on hyperlink
   */
  async clickOnHyperLink(label: string): Promise<void> {
    console.log('===== Click on HyperLink =====');
    await this.actions.click(
      this.page.locator(`//div[@class='oneRecordHomeFlexipage2Wrapper']/parent::div[contains(@class,'active')]//span[text()='${label}']//..//..//..//div//a`),
      `Click ${label}`
    );
    await this.waitFor(1000);
    console.log(`✓ Clicked on ${label} hyperlink`);
  }

  /**
   * View application details
   */
  async viewApplicationDetails(): Promise<void> {
    await this.actions.click(
      this.page.getByRole('tab', { name: 'Details' }),
      'Click Details tab'
    );
    await this.waitFor(1000);
  }

  // ==================== Verification Methods ====================

  /**
   * Get text and verify value
   */
  async getText(label: string, value: string): Promise<string> {
    console.log('===== Get Text Value & Verify =====');
    const text = await this.page.locator(
      `//span[text()='${label}']/parent::div/following-sibling::div//span/slot//lightning-formatted-text`
    ).innerText();
    console.log(`${label}: ${text}`);
    await expect(this.page.locator(
      `//span[text()='${label}']/parent::div/following-sibling::div//span/slot//lightning-formatted-text`
    )).toHaveText(value);
    return text;
  }

  /**
   * Get number text and verify
   */
  async getNumberText(label: string, value: string): Promise<string> {
    console.log('===== Get Number Text Value & Verify =====');
    const text = await this.page.locator(
      `//span[text()='${label}']/parent::div/following-sibling::div//span/slot//lightning-formatted-number`
    ).innerText();
    console.log(`${label}: ${text}`);
    await expect(this.page.locator(
      `//span[text()='${label}']/parent::div/following-sibling::div//span/slot//lightning-formatted-number`
    )).toHaveText(value);
    return text;
  }

  /**
   * Get text without verification
   */
  async getTextWithoutVerify(label: string): Promise<string> {
    console.log('===== Get Text Value without Verify =====');
    const text = await this.page.locator(
      `//span[text()='${label}']/parent::div/following-sibling::div//span/slot//lightning-formatted-text`
    ).innerText();
    console.log(`${label}: ${text}`);
    return text;
  }

  /**
   * Verify checkbox is checked
   */
  async verifyCheckboxChecked(label: string): Promise<void> {
    const checkbox = this.page.locator(
      `//div[@class='oneRecordHomeFlexipage2Wrapper']/parent::div[contains(@class,'active')]//span[text()='${label}']//..//span//..//lightning-icon`
    );
    await expect(checkbox).toBeVisible({ timeout: 5000 });
    const isChecked = await checkbox.getAttribute('icon-name');
    if (isChecked !== 'utility:check') {
      throw new Error(`${label} checkbox is NOT checked`);
    }
    console.log(`${label} checkbox is checked`);
  }
}
