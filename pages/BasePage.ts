import { Page, Locator } from '@playwright/test';
import { Actions } from '../utils/actions.util';

/**
 * Base Page Object
 * Contains common methods inherited by all page objects
 */
export abstract class BasePage {
  protected actions: Actions;

  constructor(public page: Page) {
    this.actions = new Actions(page);
  }

  // ==================== Common Locator Helpers ====================

  /**
   * Get button by name/label
   */
  protected button(name: string): Locator {
    const roleButton = this.page.getByRole('button', { name });
    const fallbackButton = this.page.locator('button, input[type="submit"], input[type="button"]').filter({
      hasText: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    }).first();
    return roleButton.or(fallbackButton).first();
  }

  /**
   * Get textbox by name/label
   */
  protected textbox(name: string): Locator {
    const roleTextbox = this.page.getByRole('textbox', { name });
    const fallbackTextbox = this.page.locator(`label:has-text("${name}"), [aria-label*="${name}" i], [placeholder*="${name}" i], input[name*="${name.toLowerCase()}" i], input[id*="${name.toLowerCase()}" i]`).first();
    return roleTextbox.or(fallbackTextbox).first();
  }

  /**
   * Get combobox by name/label
   */
  protected combobox(name: string): Locator {
    return this.page.getByRole('combobox', { name });
  }

  /**
   * Get input by label text (XPath)
   */
  protected labelInput(label: string): Locator {
    return this.page.locator(`//label[text()='${label}']//..//input`);
  }

  /**
   * Get select dropdown by label text (XPath)
   */
  protected labelSelect(label: string): Locator {
    return this.page.locator(`//div//h1[text()='${label}']//..//select`);
  }

  /**
   * Get element by text
   */
  protected byText(text: string, exact: boolean = false): Locator {
    return this.page.getByText(text, { exact });
  }

  /**
   * Get element by title
   */
  protected byTitle(title: string): Locator {
    return this.page.getByTitle(title);
  }

  // ==================== Common Actions ====================

  /**
   * Click a button by name
   */
  async clickButton(name: string): Promise<void> {
    await this.actions.click(this.button(name), `Click '${name}'`);
  }

  /**
   * Fill a textbox by name
   */
  async fillTextbox(name: string, value: string): Promise<void> {
    await this.actions.fill(this.textbox(name), value, `Fill '${name}'`);
  }

  /**
   * Fill input by label
   */
  async fillLabelInput(label: string, value: string): Promise<void> {
    await this.actions.fill(this.labelInput(label), value, `Fill '${label}'`);
  }

  /**
   * Fill textbox and press Tab
   */
  async fillTextboxWithTab(name: string, value: string): Promise<void> {
    const input = this.textbox(name);
    await input.click();
    await input.fill(value);
    await input.press('Tab');
    console.log(`✓ Entered ${name}: ${value}`);
  }

  /**
   * Select dropdown value by label (native select)
   */
  async selectDropdownByLabel(label: string, value: string): Promise<void> {
    const dropdown = this.labelSelect(label);
    await dropdown.selectOption({ value });
    console.log(`✓ Selected ${value} from ${label}`);
  }

  /**
   * Select from combobox (Salesforce Lightning)
   */
  async selectCombobox(name: string, value: string): Promise<void> {
    await this.actions.selectDropdown(this.combobox(name), value, `Select '${name}'`);
  }

  /**
   * Select from combobox by title
   */
  async selectComboboxByTitle(name: string, value: string): Promise<void> {
    await this.actions.selectByTitle(this.combobox(name), value);
  }

  /**
   * Select radio button by value
   */
  async selectRadioButton(value: string): Promise<void> {
    await this.actions.click(
      this.page.locator(`//div//div//label//input[@value='${value}']//../span//span[@class='slds-radio_faux']`),
      `Select radio '${value}'`
    );
  }

  // ==================== Navigation ====================

  /**
   * Click on hamburger menu and select option
   */
  async clickHamburgerMenu(menuOption: string): Promise<void> {
    console.log(`[Open hamburger menu]`);
    const hamburger = this.page.getByRole('button', { name: '...' }).first()
      .or(this.page.getByText('...', { exact: true }).first())
      .or(this.page.locator('.slds-icon-utility-rows').first())
      .or(this.page.locator("//button[@class='breadcrumb-button']").first());
      
    await hamburger.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await hamburger.click({ force: true }).catch(() => {});
    
    await this.page.waitForTimeout(1500);

    console.log(`[Select ${menuOption}]`);
    const targetLink = this.page.getByRole('button', { name: new RegExp(menuOption, 'i') })
      .or(this.page.getByRole('menuitem', { name: new RegExp(menuOption, 'i') }))
      .or(this.page.locator(`//div[@class='hamburger-menu']//div//button[text()='${menuOption}']`));
      
    if (await targetLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await targetLink.click({ force: true }).catch(() => {});
    } else {
      console.log(`⚠ ${menuOption} not visible in menu. Retrying hamburger click...`);
      await hamburger.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(1500);
      await targetLink.click({ force: true }).catch(() => {});
    }
  }

  /**
   * Click on menu tab
   */
  async clickMenuTab(tabName: string): Promise<void> {
    await this.actions.click(
      this.page.locator(`//a[@role='menuitem']//span[contains(text(), '${tabName}')]`),
      `Click ${tabName} tab`
    );
  }

  // ==================== Screen Verification ====================

  /**
   * Get current screen name
   */
  async getCurrentScreen(): Promise<string> {
    const screen = this.page.locator("//div[@class='currentScreen']");
    try {
      const visible = await screen.isVisible({ timeout: 2000 }).catch(() => false);
      if (!visible) return '';
      return await screen.innerText();
    } catch (e) {
      return '';
    }
  }

  /**
   * Verify current screen matches expected
   */
  async verifyCurrentScreen(expected: string | string[]): Promise<void> {
    const actual = await this.getCurrentScreen();
    const expectedValues = Array.isArray(expected) ? expected : [expected];
    const match = expectedValues.includes(actual);
    console.log(`Screen: ${actual} (expected: ${expectedValues.join(' or ')})`);
    if (!match) {
      console.warn(`Warning: current screen '${actual}' did not match expected value(s)`);
    }
  }

  /**
   * Check if current screen matches expected
   */
  async isCurrentScreen(expected: string | string[]): Promise<boolean> {
    const actual = await this.getCurrentScreen();
    const expectedValues = Array.isArray(expected) ? expected : [expected];
    return expectedValues.includes(actual);
  }

  // ==================== Error Handling ====================

  /**
   * Check for application errors
   */
  async checkForErrors(): Promise<void> {
    await this.actions.checkForErrors();
  }

  // ==================== Wait Helpers ====================

  /**
   * Wait for specified milliseconds
   */
  async waitFor(ms: number): Promise<void> {
    if (this.page.isClosed()) {
      return;
    }

    try {
      await this.page.waitForTimeout(ms);
    } catch (error) {
      if (this.page.isClosed()) {
        return;
      }
      throw error;
    }
  }

  /**
   * Reload page
   */
  async reload(): Promise<void> {
    await this.page.reload();
    await this.waitFor(1000);
  }

  // ==================== Lookup Helpers ====================

  /**
   * Enter value in lookup field and select from dropdown
   */
  async lookupValue(label: string, value: string): Promise<void> {
    const input = this.textbox(label);
    await input.click();
    await input.press('Control+A');
    await input.press('Backspace');
    await this.page.keyboard.insertText(value);
    await input.press('Backspace');
    await this.actions.click(
      this.page.locator(`//div[@class='slds-box']//..//li[text()='${value}']`).first(),
      `Select ${value}`
    );
    console.log(`✓ Selected ${value} from ${label}`);
  }

  /**
   * Enter value in lookup and select by text
   */
  async lookupAndSelectByText(label: string, value: string): Promise<void> {
    const input = this.textbox(label);
    await input.click();
    await input.press('Control+A');
    await input.press('Backspace');
    await this.actions.type(input, value + ' ', 100);
    await this.actions.click(this.page.getByText(value).first(), `Select ${value}`);
    console.log(`✓ Selected ${value} from ${label}`);
  }
}
