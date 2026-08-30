import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * WorkbenchPage - Handles Salesforce Workbench operations
 * Used for executing SOQL queries, API calls, and data operations
 */
export class WorkbenchPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ==================== Dynamic Locators ====================

  /**
   * Get dropdown locator by field label
   */
  private getDropdownByLabel(field: string): Locator {
    return this.page.locator(`//label[text()='${field}']/parent::p//select`);
  }

  /**
   * Get checkbox locator by label
   */
  private getCheckboxByLabel(label: string): Locator {
    return this.page.locator(
      `//a[normalize-space(text())='${label}']/parent::label/parent::div//input[@type='checkbox']`
    );
  }

  /**
   * Get button locator by name
   */
  private getButtonByName(buttonName: string): Locator {
    return this.page.locator(
      `//input[normalize-space(@value)='${buttonName}']`
    ).first();
  }

  /**
   * Get header tab locator
   */
  private getHeaderTab(tabName: string): Locator {
    return this.page.locator(`//span[text()='${tabName}']/parent::a`);
  }

  /**
   * Get tab option locator
   */
  private getTabOption(tabName: string, tabOptions: string): Locator {
    return this.page.locator(
      `//span[text()='${tabName}']/parent::a/following::a[text()='${tabOptions}']`
    );
  }

  /**
   * Get script input textarea
   */
  private get scriptInput(): Locator {
    return this.page.locator(`//textarea[@id='scriptInput']`);
  }

  // ==================== Actions ====================

  /**
   * Select a value from dropdown by field label
   * @param field - Label of the dropdown field
   * @param expectedOption - Option to select
   */
  async selectDropDownValue(field: string, expectedOption: string): Promise<void> {
    try {
      const dropdown = this.getDropdownByLabel(field);
      
      await dropdown.waitFor({ state: 'visible', timeout: 10000 });
      
      if (await dropdown.isVisible()) {
        await dropdown.selectOption({ label: expectedOption });
      } else {
        throw new Error(`${field} is not displayed.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to handle dropdown: ${errorMessage}`);
      throw new Error('Failed to handle dropdown.');
    }
  }

  /**
   * Select a checkbox by label
   * @param label - Label of the checkbox
   */
  async selectCheckBox(label: string): Promise<void> {
    try {
      const checkbox = this.getCheckboxByLabel(label);
      
      await checkbox.waitFor({ state: 'visible', timeout: 10000 });
      
      if (await checkbox.isVisible()) {
        if (await checkbox.isChecked()) {
          console.log(`${label} checkbox is already selected`);
        } else {
          await checkbox.check();
          console.log(`${label} checkbox is clicked`);
        }
      } else {
        throw new Error(`${label} checkbox is not present`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to click checkbox ${label}. Exception - ${errorMessage}`
      );
    }
  }

  /**
   * Click a button by name
   * @param buttonName - Name/value of the button
   */
  async clickButton(buttonName: string): Promise<void> {
    try {
      const button = this.getButtonByName(buttonName);
      
      await button.waitFor({ state: 'visible', timeout: 10000 });
      await button.scrollIntoViewIfNeeded();
      await button.click();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to click button ${buttonName}: ${errorMessage}`);
      throw new Error(`Failed to click button ${buttonName}`);
    }
  }

  /**
   * Click on a header tab and then select an option
   * @param tabName - Name of the header tab
   * @param tabOptions - Option under the tab to click
   */
  async clickOnHeaderTab(tabName: string, tabOptions: string): Promise<void> {
    try {
      const tabLocator = this.getHeaderTab(tabName);
      const optionLocator = this.getTabOption(tabName, tabOptions);
      
      await tabLocator.waitFor({ state: 'visible', timeout: 10000 });
      await tabLocator.click();
      
      const isVisible = await optionLocator.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        await optionLocator.hover();
        await optionLocator.click();
      } else {
        console.error(`${tabOptions} button is not displayed in 5 seconds.`);
        throw new Error(`${tabOptions} button is not displayed in 5 seconds.`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to click on header button ${tabOptions}. Error: ${errorMessage}`);
      throw new Error(`Failed to click on header button ${tabOptions}.`);
    }
  }

  /**
   * Enter text in the script input textarea
   * @param value - Text to enter
   */
  async enterTextField(value: string): Promise<void> {
    try {
      const textField = this.scriptInput;
      
      const isVisible = await textField.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        await textField.fill(value);
      } else {
        throw new Error('Script input textarea is not visible');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to type in textarea: ${errorMessage}`);
      throw new Error('Failed to type in textarea.');
    }
  }

  /**
   * Execute a SOQL query in workbench
   * @param query - SOQL query string
   */
  async executeSOQLQuery(query: string): Promise<void> {
    await this.clickOnHeaderTab('queries', 'SOQL Query');
    await this.enterTextField(query);
    await this.clickButton('Query');
  }

  /**
   * Execute an Apex script in workbench
   * @param script - Apex code to execute
   */
  async executeApexCode(script: string): Promise<void> {
    await this.clickOnHeaderTab('utilities', 'Apex Execute');
    await this.enterTextField(script);
    await this.clickButton('Execute');
  }
}
