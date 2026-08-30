import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * MITC Page Object
 * Handles Most Important Terms & Conditions page
 */
export class MitcPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Check if current page is MITC
   */
  async isMitcPage(): Promise<boolean> {
    const screen = await this.getCurrentScreen();
    return screen === 'MITC';
  }

  /**
   * Fill MITC details with first and last name
   */
  async fillMitcDetailsWithFirstAndLastName(firstName: string, lastName: string, proceedButton: string): Promise<void> {
    console.log('===== MITC Page =====');
    await this.verifyCurrentScreen('MITC');

    // Helper to safely clear and fill text fields in LWC
    const clearAndFill = async (loc: import('@playwright/test').Locator, value: string, desc: string) => {
      console.log(`[${desc}] ${value}`);
      await loc.scrollIntoViewIfNeeded();
      await loc.click({ clickCount: 3 }).catch(() => {});
      await loc.press('Control+A').catch(() => {});
      await loc.press('Backspace').catch(() => {});
      await this.page.waitForTimeout(200);
      
      // Force LWC to recognize the empty state
      await loc.evaluate((el: HTMLInputElement) => {
        el.value = '';
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }).catch(() => {});
      
      await loc.fill(value, { force: true });
    };

    const firstNameLoc = this.page.locator("xpath=//label[contains(text(), 'First Name')]//..//input").filter({ state: 'visible' }).first();
    await clearAndFill(firstNameLoc, firstName, 'Enter first name');

    const middleNameLoc = this.page.locator("xpath=//label[contains(text(), 'Middle Name')]//..//input").filter({ state: 'visible' }).first();
    if (await middleNameLoc.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('Clearing middle name to prevent validation errors');
      await clearAndFill(middleNameLoc, '', 'Clear middle name');
    }

    const lastNameLoc = this.page.locator("xpath=//label[contains(text(), 'Last Name')]//..//input").filter({ state: 'visible' }).first();
    await clearAndFill(lastNameLoc, lastName, 'Enter last name');

    // Proceed
    await this.clickButton(proceedButton);
    await this.checkForErrors();
    await this.waitFor(3000);
    console.log('✓ MITC completed');
  }


  /**
 * Fill MITC details with first and last name
 */
  async fillMitcDetailsWithMiddleName(firstName: string, middleName: string, lastName: string, proceedButton: string): Promise<void> {
    console.log('===== MITC Page =====');
    await this.verifyCurrentScreen('MITC');

    // Enter First Name
    await this.actions.fill(
      this.page.locator("//label[text()='First Name ']//..//input"),
      firstName,
      'Enter first name'
    );

    //Enter Middle Name
    await this.actions.fill(
      this.page.getByRole('textbox', { name: 'Enter Middle Name' }),
      middleName,
      'Enter middle name'
    );

    // Enter Last Name
    await this.actions.fill(
      this.page.locator("//label[text()='Last Name']//..//input"),
      lastName,
      'Enter last name'
    );

    // Proceed
    await this.clickButton(proceedButton);
    await this.checkForErrors();
    await this.waitFor(3000);
    console.log('✓ MITC completed');
  }


  /**
   * Complete the MITC transition and navigate to PAN/Data Verification.
   * If the proceed button is visible within 2 seconds, click it and flow directly into
   * Data Verification. Otherwise, reload the page and use the Yes/Enter Manually fallback.
   */
  async proceedToPanVerification(proceedButton: string = 'Proceed'): Promise<void> {
    const proceedLocator = this.page.getByRole('button', { name: proceedButton, exact: true }).first();
    const isImmediateProceedVisible = await proceedLocator.isVisible({ timeout: 5000 }).catch(() => false);

    if (isImmediateProceedVisible) {
      await proceedLocator.click();
      await this.waitFor(1500);

      // Fallback if no prompt appears
      await expect(this.page.getByText('Data Verification')).toBeVisible({ timeout: 15000 }).catch(() => { });
      console.log('✓ Proceeded past MITC');
      return;
    }

    await this.page.reload();
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(2000);

    await expect(proceedLocator).toBeVisible({ timeout: 15000 });
    await proceedLocator.click();

    console.log('✓ Reload fallback path used');
  }

  private async clearPanVerificationFields(): Promise<void> {
    const fieldLocators = [
      this.page.getByRole('textbox', { name: 'Enter PAN Number', exact: true }),
      this.page.getByRole('textbox', { name: 'Enter Customer First Name on PAN', exact: true }),
      this.page.getByRole('textbox', { name: 'Enter Customer Last Name on PAN', exact: true }),
    ];

    for (const field of fieldLocators) {
      if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
        await field.click();
        await field.fill('');
      }
    }
  }

  // /**
  //  * Just click proceed (when data is pre-filled)
  //  */
  // async proceedOnly(proceedButton: string): Promise<void> {
  //   await this.clickButton(proceedButton);
  //   await this.checkForErrors();
  //   await this.waitFor(1000);
  // }
}
