import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Case Page Object
 * Handles case operations in ops org
 */
export class CasePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Error Handling ====================

  async checkForErrorAndFail(): Promise<void> {
    await this.actions.checkForErrors();
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

  // ==================== Search Methods ====================

  /**
   * Search value in search field and open case
   */
  async searchValueInSearchField(
    searchLabel: string,
    searchFieldLabel: string,
    searchFieldValue: string
  ): Promise<string> {
    console.log('===== Search Opportunity Id & Open Case Page =====');
    await this.clickButton(searchLabel);
    await this.enterValueInTextField(searchFieldLabel, searchFieldValue);
    await this.actions.click(
      this.page.locator("//lightning-formatted-rich-text//span[contains(text(),'Show more results')]"),
      'Click Show more results'
    );
    console.log('✓ Clicked on Show more results link');
    await this.waitFor(1000);
    
    const text = await this.page.locator("//span[text()='Case Number']/ancestor::table//tbody//th/span/a").innerText();
    console.log(text);
    await this.actions.click(
      this.page.locator("//span[text()='Case Number']/ancestor::table//tbody//th/span/a"),
      'Click case number'
    );
    await this.waitFor(10000);
    console.log(`✓ Navigated to ${searchFieldValue}`);
    return text;
  }

  /**
   * Enter value in global search and click
   */
  async enterValueInGlobalSearchAndClick(tabName: string, label: string, caseId: string): Promise<void> {
    console.log('===== Search Case Id in Ops Org =====');
    await this.actions.fill(
      this.page.locator(`//div[@class='uiInput uiAutocomplete uiInput--default']//input`),
      caseId,
      `Enter ${caseId} in search field`
    );
    await this.page.locator(`//div[@class='uiInput uiAutocomplete uiInput--default']//input`).press('Enter');
    console.log(`✓ Entered ${caseId} into ${label}`);
    await this.actions.click(
      this.page.getByRole('link', { name: `${caseId}` }),
      `Click on ${caseId}`
    );
    console.log(`✓ Selected ${caseId} from search results`);
    await this.waitFor(10000);
  }

  // ==================== Status Methods ====================

  /**
   * Update status
   */
  async updateStatus(edit: string, label: string, value: string): Promise<void> {
    console.log('===== Update Status Value =====');
    const status = await this.page.locator(
      "//span[text()='Status']/parent::div/following-sibling::div//span/slot//lightning-formatted-text"
    ).innerText();
    console.log(status);
    
    if (status === 'OCR') {
      await this.actions.click(
        this.page.locator('button').filter({ hasText: edit }).last(),
        `Click ${edit}`
      );
      await this.actions.click(
        this.page.locator(`//label[text()='${label}']//..//..//button`),
        'Open dropdown'
      );
      await this.actions.click(
        this.page.locator(`//label[text()='${label}']//..//..//span[text()='${value}']`),
        `Select ${value}`
      );
      console.log(`✓ Selected ${value} from ${label} dropdown`);
      await this.actions.click(this.page.getByText('Save', { exact: true }), 'Click Save');
      await this.waitFor(10000);
    } else {
      console.log(`Status is "${status}" not OCR, so skipping status update`);
    }
  }

  /**
   * Get text value
   */
  async getText(label: string): Promise<string> {
    console.log('===== Get Text Value =====');
    const text = await this.page.locator(
      `//span[text()='${label}']/parent::div/following-sibling::div//span/slot//lightning-formatted-text`
    ).innerText();
    console.log(`${label}: ${text}`);
    return text;
  }

  // ==================== App Launcher Methods ====================

  /**
   * Click on app launcher and navigate to app
   */
  async clickOnAppLauncher(value: string): Promise<void> {
    await this.actions.click(this.page.locator("//button[@title='App Launcher']"), 'Click App Launcher');
    console.log('✓ Clicked on App Launcher');
    await this.actions.click(
      this.page.getByRole('combobox', { name: 'Search apps and items...' }),
      'Click search'
    );
    console.log('✓ Clicked on Search apps and items...');
    await this.actions.fill(
      this.page.getByRole('combobox', { name: 'Search apps and items...' }),
      value,
      `Entering app name: ${value}`
    );
    console.log(`✓ Entered app name: ${value}`);
    await this.actions.click(
      this.page.locator(`//p[@class='slds-truncate']//b[text()='${value}']`),
      `Click ${value}`
    );
    console.log(`✓ Clicked on ${value} App`);
  }

  // ==================== Tab Methods ====================

  /**
   * Click on tabs
   */
  async clickOnTabs(label: string): Promise<void> {
    await this.actions.click(
      this.page.locator(`//span[text()='${label}']//..//..//a`),
      `Click ${label} tab`
    );
    console.log(`✓ Clicked on Tab: ${label}`);
  }

  /**
   * POI Tab actions
   */
  async poiTab(poiLabel: string, passButtonValue: string): Promise<void> {
    await this.clickOnTabs(poiLabel);
    await this.waitFor(500);
    
    const checkbox = this.page.locator(
      "//span[text()='BLIND DATA ENTRY']//following::div//span[@class='slds-checkbox']//..//label//..//span[@class='slds-checkbox_faux']"
    );
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
      console.log('Checkbox checked');
    } else {
      console.log('Checkbox already checked');
    }
    console.log('✓ Checked checkbox for BLIND DATA ENTRY');
    await this.clickButton(passButtonValue);
    await this.waitFor(5000);
    console.log(`✓ Completed ${poiLabel} Tab actions`);
  }

  /**
   * POA Tab actions
   */
  async poaTab(poaLabel: string, passButtonValue: string): Promise<void> {
    await this.clickOnTabs(poaLabel);
    await this.waitFor(500);
    
    const checkbox = this.page.locator(
      "//span[text()='BLIND DATA ENTRY']//following::div//span[@class='slds-checkbox']//..//label//..//span[@class='slds-checkbox_faux']"
    );
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
      console.log('Checkbox checked');
    } else {
      console.log('Checkbox already checked');
    }
    console.log('✓ Checked checkbox for BLIND DATA ENTRY');
    await this.clickButton(passButtonValue);
    await this.waitFor(5000);
    console.log(`✓ Completed ${poaLabel} Tab actions`);
  }
}
