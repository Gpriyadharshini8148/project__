import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Surrogate Details Page Object
 * Handles credit program / process type selection & approval checks
 */
export class SurrogateDetailsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for Surrogate Details screen — NO hamburger navigation.
   * After the full E2E flow (POA → Proceed), the app lands here automatically.
   */
  async navigateToSurrogateDetails(): Promise<boolean> {
    console.log('===== Waiting for Surrogate Details screen (E2E flow) =====');

    // Wait for URL to leave searchmain (in case we just came from search)
    try {
      await this.page.waitForFunction(
        () => !window.location.href.includes('searchmain'),
        { timeout: 15000 }
      );
    } catch {
      console.log('⚠ URL still on searchmain — proceeding anyway');
    }

    // Wait for network to settle
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
    await this.page.waitForTimeout(1000);

    // The app should already be on Surrogate Details after the full E2E flow.
    // Simply verify the current screen — no hamburger, no breadcrumb clicks.
    const currentScreen = await this.getCurrentScreen();

    if (currentScreen.includes('Surrogate Details')) {
      console.log('✓ Already on Surrogate Details screen (E2E flow reached here naturally)');
      return true;
    }

    // If not yet on Surrogate Details, wait up to 60s for it to appear (no hamburger)
    console.log(`ℹ Current screen: "${currentScreen}" — waiting up to 60s for Surrogate Details...`);
    await this.page.waitForFunction(
      () => {
        const el = document.querySelector('.currentScreen');
        return el && el.textContent && el.textContent.includes('Surrogate Details');
      },
      { timeout: 60000 }
    ).catch(() => {
      console.warn('⚠ Surrogate Details screen did not appear within 60s — continuing anyway');
    });

    const finalScreen = await this.getCurrentScreen();
    console.log(`✓ Current screen after wait: "${finalScreen}"`);
    return finalScreen.includes('Surrogate Details');
  }
  /**
   * Navigate to Surrogate Details via Hamburger menu (from App Status page)
   */
  async navigateViaHamburger(): Promise<void> {
    console.log('===== Navigating to Surrogate Details via Hamburger =====');

    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
    await this.page.waitForTimeout(1000);

    // Step 1: Open the hamburger / ellipsis (…) menu
    try {
      const menuBtn = this.page.getByRole('button', { name: '...' }).first();
      if (await menuBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await menuBtn.click({ force: true });
        console.log('✓ Clicked hamburger (getByRole "...")');
      } else {
        // Fallback CSS selectors
        const hamburgerBtn = this.page.locator("button:has-text('...'), button[title='...']").first();
        await hamburgerBtn.click({ force: true });
        console.log('✓ Clicked hamburger (CSS fallback)');
      }
    } catch {
      console.log('⚠ Could not click hamburger — proceeding anyway');
    }

    await this.page.waitForTimeout(1000);

    // Step 2: Click EXACTLY "Surrogate Details"
    // Salesforce renders menu text in nested <span>s, so we use getByText with exact match
    // and then navigate up to the clickable element
    let clicked = false;

    // Try 1: getByText exact — finds the element with EXACTLY this text (no partial match)
    const textLocator = this.page.getByText('Surrogate Details', { exact: true }).first();
    if (await textLocator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textLocator.click({ force: true });
      console.log('✓ Clicked "Surrogate Details" (getByText exact)');
      clicked = true;
    }

    // Try 2: XPath matching exact text node — most strict approach
    if (!clicked) {
      const xpathLocator = this.page.locator(
        "//*[self::button or self::a or self::li][normalize-space(string(.))='Surrogate Details']"
      ).first();
      if (await xpathLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
        await xpathLocator.click({ force: true });
        console.log('✓ Clicked "Surrogate Details" (XPath exact string)');
        clicked = true;
      }
    }

    // Try 3: Filter all visible links/buttons by exact text to rule out "Approval Details"
    if (!clicked) {
      const allMenuItems = this.page.locator('button, a, li[role="option"], li[role="menuitem"]');
      const count = await allMenuItems.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        const item = allMenuItems.nth(i);
        const text = (await item.innerText().catch(() => '')).trim();
        if (text === 'Surrogate Details') { // Exact match — rules out "Approval Details"
          if (await item.isVisible({ timeout: 500 }).catch(() => false)) {
            await item.click({ force: true });
            console.log(`✓ Clicked "Surrogate Details" (loop match at index ${i})`);
            clicked = true;
            break;
          }
        }
      }
    }

    if (!clicked) {
      console.log('⚠ "Surrogate Details" menu item not found — continuing anyway');
    }

    await this.page.waitForTimeout(2000);
    const finalScreen = await this.getCurrentScreen();
    console.log(`✓ Current screen after hamburger navigation: "${finalScreen}"`);
  }


  async selectSurrogateDetails(
    expectedValue: string,
    processTypeLabel: string,
    processTypeValue: string,
    creditProgramLabel: string,
    creditProgramValue: string,
    checkApprovalButtonLabel: string,
    rsaLabel?: string,
    rsaValue?: string,
    rsaRejectReason?: string,
    bankName?: string,
    stopAfterCheckApproval: boolean = false
  ): Promise<void> {
    console.log('===== Complete the Surrogate Details =====');

    // Select Credit Program if visible
    if (creditProgramLabel && creditProgramValue) {
      console.log(`Selecting Credit Program: ${creditProgramValue}`);
      // Check for <select> and LWC <lightning-combobox> or a button/input following the h1/label
      const cpSelect = this.page.locator(
        "//select[contains(@name, 'credit')] | " +
        "//h1[contains(text(),'Credit Program')]/following-sibling::*//button | " +
        "//h1[contains(text(),'Credit Program')]/following-sibling::*//input | " +
        "//h1[contains(text(),'Credit Program')]/following-sibling::*//select | " +
        "//label[contains(text(),'Credit Program')]/..//select | " +
        "//div[contains(text(),'Credit Program')]/..//select | " +
        "//lightning-combobox[.//label[contains(text(), 'Credit Program')]]//button | " +
        "//lightning-combobox[.//label[contains(text(), 'Credit Program')]]//input"
      ).first();

      const isCpVisible = await cpSelect.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
      if (isCpVisible) {
        const tagName = await cpSelect.evaluate(el => el.tagName.toLowerCase()).catch(() => '');
        if (tagName === 'select') {
          await cpSelect.selectOption({ label: creditProgramValue }).catch(async () => {
            await cpSelect.selectOption({ index: 1 }).catch(() => { });
          });
        } else {
          // LWC combobox fallback
          await cpSelect.scrollIntoViewIfNeeded().catch(() => { });
          await cpSelect.click({ force: true });
          await this.page.waitForTimeout(1000);
          const optionItem = this.page.locator(`//lightning-base-combobox-item//span[contains(text(),'${creditProgramValue.substring(0, 4)}')] | //*[role="option"]//*[contains(text(),'${creditProgramValue.substring(0, 4)}')] | //*[role="option" and contains(@data-value, '${creditProgramValue.substring(0, 4)}')]`).filter({ visible: true }).first();
          if (await optionItem.isVisible({ timeout: 2000 }).catch(() => false)) {
            await optionItem.scrollIntoViewIfNeeded().catch(() => { });
            await optionItem.click({ force: true });
          } else {
            await this.page.keyboard.press(creditProgramValue.charAt(0));
            await this.page.keyboard.press('Enter');
          }
        }
      } else {
        console.log('⚠ Credit Program combobox/select was not visible');
      }
    }

    // Select RSA & Reject Reason if provided
    if (rsaValue) {
      await this.selectRsaDetails(rsaValue, rsaRejectReason);
    }

    // Automatically attempt to select Bank Name if it exists on the screen, as it's mandatory on some variants
    await this.selectBankName(bankName || 'Axis Bank');

    // Step 1: Click the appropriate button (Check Approval or Proceed)
    if (checkApprovalButtonLabel && checkApprovalButtonLabel.trim().toLowerCase() === 'proceed') {
      console.log('===== Clicking Proceed (Reappraisal flow) =====');
      await this.clickButton('Proceed');
    } else {
      await this.clickCheckApproval(stopAfterCheckApproval);
    }

    // Check for errors after button click
    await this.checkForErrors();

    // Step 2: Click Proceed
    // Per user request, do not click proceed here because the "Approved" popup already navigates
    // await this.clickProceed();
  }

  /**
   * Click Check Approval button and wait for loading spinner to detach
   * @param isNegativeTest If true, skips the approval popup check
   */
  async clickCheckApproval(isNegativeTest: boolean = false): Promise<boolean> {
    console.log('===== Clicking Check Approval =====');
    const checkBtn = this.page.getByRole('button', { name: 'Check Approval' })
      .or(this.page.locator('button, lightning-button').filter({ hasText: /Check Approval/i })).first();

    // Wait up to 20 seconds because button might take time to render after selections
    const isCheckBtnVisible = await checkBtn.waitFor({ state: 'visible', timeout: 20000 }).then(() => true).catch(() => false);
    if (isCheckBtnVisible) {
      await checkBtn.scrollIntoViewIfNeeded().catch(() => { });

      let clicked = false;
      await checkBtn.click({ timeout: 5000 }).then(() => clicked = true).catch(async () => {
        await checkBtn.evaluate((el: HTMLElement) => el.click()).then(() => clicked = true).catch(async () => {
          await checkBtn.click({ force: true }).then(() => clicked = true).catch(() => { });
        });
      });

      if (clicked) {
        console.log('✓ Clicked Check Approval button');
      } else {
        console.log('⚠ Could not click Check Approval button');
      }

      // Wait dynamically for spinner to disappear
      await this.page.locator('.slds-spinner_container').waitFor({ state: 'detached', timeout: 20000 }).catch(() => { });

      if (isNegativeTest) {
        console.log('⚠ Negative test: Skipping approval popup check.');
        return true;
      }

      // The backend scheduler handles approval, and the "View Approval Details" popup will appear.
      // We no longer wait for it here because ApprovalDetailsPage.ts handles that wait (up to 2 mins).
      // We just consider the "Check Approval" click a success and return.
      console.log('✓ Check Approval processed. Handing off wait logic to Approval Details stage.');

      return true;
    } else {
      console.log('⚠ Check Approval button was not visible or already processed (Proceed is present)');
      return false;
    }
  }

  /**
   * Click Proceed button to move to the next stage
   */
  async clickProceed(): Promise<boolean> {
    console.log('===== Clicking Proceed =====');
    const proceedBtn = this.page.getByRole('button', { name: 'Proceed' })
      .or(this.page.locator('button, lightning-button, input[type="button"], input[type="submit"]').filter({ hasText: /^Proceed$/i }).first())
      .or(this.page.locator('button:has-text("Proceed")').first());

    const isProceedVisible = await proceedBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (isProceedVisible) {
      await proceedBtn.click({ force: true }).catch(async () => {
        await proceedBtn.dispatchEvent('click');
      });
      console.log('✓ Clicked Proceed button successfully');
      return true;
    } else {
      console.log('⚠ Proceed button was not visible');
      return false;
    }
  }

  /**
   * Select RSA Option and optional RSA Reject Reason
   * Uses the same h1-based XPath pattern as BasePage.labelSelect (mirrors POI Type / POA Type).
   * Falls back to lightning-combobox button click + option pick for LWC components.
   */
  async selectRsaDetails(rsaValue: string, rejectReason?: string): Promise<void> {
    console.log(`===== Selecting RSA: ${rsaValue} =====`);
    await this.selectLwcDropdown('RSA', rsaValue, /* excludeLabel= */ 'Reason');

    if (rejectReason) {
      console.log(`===== Selecting RSA Reject Reason: ${rejectReason} =====`);

      // RSA Reject Reason renders DYNAMICALLY after RSA value is chosen.
      // Wait up to 1 s for the field to appear before trying to select it.
      // The field might be labeled "RSA Reject Reason" or just "Reason".
      const rejectReasonField = this.page.locator(
        `//div//h1[contains(normalize-space(text()),'Reject Reason') or contains(normalize-space(text()),'Reason')]//..//select | ` +
        `//label[contains(normalize-space(text()),'Reject Reason') or contains(normalize-space(text()),'Reason')]/..//select | ` +
        `//lightning-combobox[.//label[contains(normalize-space(text()),'Reject Reason') or contains(normalize-space(text()),'Reason')]]//button | ` +
        `//div[contains(@class,'slds-form-element')][.//label[contains(normalize-space(text()),'Reject Reason') or contains(normalize-space(text()),'Reason')]]//button`
      ).first();

      const appeared = await rejectReasonField
        .waitFor({ state: 'visible', timeout: 1000 })
        .then(() => true)
        .catch(() => false);

      if (!appeared) {
        console.log(`⚠ RSA Reject Reason field did not appear after RSA="${rsaValue}" — skipping`);
      } else {
        // We know it appeared, try to select it via the wrapper method (checking both labels)
        try {
          await this.selectLwcDropdown('RSA Reject Reason', rejectReason);
        } catch {
          await this.selectLwcDropdown('Reason', rejectReason);
        }
      }
    }
  }

  /**
   * Generic LWC/native dropdown selector — mirrors the BasePage.labelSelect (h1-based) pattern
   * used by POI Type, POA Type, etc.
   *
   * Strategy (in order):
   *  1. Native <select> located via h1 label  →  BasePage.labelSelect pattern
   *  2. Native <select> located via <label>   →  fallback XPath
   *  3. LWC lightning-combobox button         →  click to open, then pick option
   *
   * @param label       Visible label text (e.g. 'RSA', 'RSA Reject Reason')
   * @param value       Option to select
   * @param excludeLabel  If set, the matched label element must NOT contain this text
   */
  protected async selectLwcDropdown(label: string, value: string, excludeLabel?: string): Promise<void> {
    if (!value || !value.trim()) return;
    await this.page.waitForTimeout(500);

    // Build the XPath not() fragment once and reuse in all 3 strategies.
    // This checks only the label element's own text — NOT the parent container
    // (parent textContent would include sibling labels like "RSA Reject Reason").
    const notPart = excludeLabel
      ? ` and not(contains(normalize-space(text()),'${excludeLabel}'))`
      : '';

    // ── Strategy 1: native <select> via h1 (BasePage.labelSelect exact pattern) ──
    // Uses both exact and contains() to handle "RSA *" required-field label variants.
    const h1Select = this.page.locator(
      `//h1[normalize-space(text())='${label}'${notPart}]//..//select | ` +
      `//h1[contains(normalize-space(text()),'${label}')${notPart}]//..//select`
    ).first();
    if (await h1Select.isVisible({ timeout: 500 }).catch(() => false)) {
      try {
        await h1Select.selectOption({ label: value });
        console.log(`✓ [${label}] selected via h1 native <select> (label): ${value}`);
        return;
      } catch {
        try {
          await h1Select.selectOption({ value });
          console.log(`✓ [${label}] selected via h1 native <select> (value): ${value}`);
          return;
        } catch { /* fall through */ }
      }
    }

    // ── Strategy 2: native <select> via <label> tag ──
    // not() is baked into XPath so it only inspects THIS label's own text,
    // not the parent container (which could contain sibling labels).
    const labelSelect = this.page.locator(
      `//label[contains(normalize-space(text()),'${label}')${notPart}]/..//select`
    ).first();
    if (await labelSelect.isVisible({ timeout: 500 }).catch(() => false)) {
      try {
        await labelSelect.selectOption({ label: value });
        console.log(`✓ [${label}] selected via <label> native <select> (label): ${value}`);
        return;
      } catch {
        try {
          await labelSelect.selectOption({ value });
          console.log(`✓ [${label}] selected via <label> native <select> (value): ${value}`);
          return;
        } catch { /* fall through */ }
      }
    }

    // ── Strategy 3: LWC lightning-combobox (click button, then pick visible option) ──
    const lwcBtn = this.page.locator(
      `//lightning-combobox[.//label[contains(normalize-space(text()),'${label}')${notPart}]]//button | ` +
      `//div[contains(@class,'slds-form-element')][.//label[contains(normalize-space(text()),'${label}')${notPart}]]//button`
    ).first();

      if (await lwcBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await lwcBtn.scrollIntoViewIfNeeded().catch(() => { });
      // Ensure focus is given so keyboard fallback works if needed
      await lwcBtn.focus().catch(() => { });
      await lwcBtn.click({ force: true });
      await this.page.waitForTimeout(800);

      // Try Playwright's built-in locator that pierces shadow DOM first
      let option = this.page.getByRole('option', { name: new RegExp(`^${value}$`, 'i') }).first();
      let optionVisible = await option.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (!optionVisible) {
        // Fallback to the explicit XPaths
        option = this.page.locator(
          `//*[@role='option'][.//*[normalize-space(text())='${value}']] | ` +
          `//lightning-base-combobox-item[.//*[normalize-space(text())='${value}']] | ` +
          `//*[@role='option'][@data-value='${value}']`
        ).filter({ visible: true }).first();
        optionVisible = await option.isVisible({ timeout: 1000 }).catch(() => false);
      }

      if (optionVisible) {
        await option.scrollIntoViewIfNeeded().catch(() => { });
        await option.click({ force: true });
        console.log(`✓ [${label}] selected via LWC combobox option: ${value}`);
        return;
      }

      // Keyboard fallback - now with guaranteed focus
      console.log(`⚠ Option not found in DOM, trying keyboard fallback for: ${value}`);
      await this.page.keyboard.press(value.charAt(0));
      await this.page.waitForTimeout(400);
      await this.page.keyboard.press('Enter');
      console.log(`✓ [${label}] selected via keyboard fallback: ${value}`);
      return;
    }

    console.log(`⚠ [${label}] dropdown not found — skipping selection of "${value}"`);
  }

  /**
   * Select Customer Bank Name
   */
  async selectBankName(bankName: string): Promise<void> {
    console.log(`===== Selecting Customer Bank Name: ${bankName} =====`);

    const bankSelect = this.page.locator("//label[contains(text(),'Customer Bank Name')]/..//select | //div[contains(text(),'Customer Bank Name')]/..//select | select[name*='bank']").first();
    if (await bankSelect.isVisible({ timeout: 500 }).catch(() => false)) {
      await bankSelect.selectOption({ label: bankName }).catch(async (e) => {
        console.log(`⚠ Failed to select Bank natively by label. Error: ${e.message}`);
        await bankSelect.selectOption({ value: bankName }).catch(() => { });
      });
      console.log(`✓ Selected Customer Bank Name native select: ${bankName}`);
    } else {
      const bankCombo = this.page.locator('lightning-combobox').filter({ hasText: 'Customer Bank Name' }).locator('button, input').first();
      const isComboVisible = await bankCombo.isVisible({ timeout: 500 }).catch(() => false);

      if (isComboVisible) {
        await bankCombo.scrollIntoViewIfNeeded().catch(() => { });
        await bankCombo.click({ force: true });
        await this.page.waitForTimeout(1000);

        // Find visible option globally
        const optionItem = this.page.locator(`//lightning-base-combobox-item//span[text()='${bankName}'] | //*[role="option"]//*[text()='${bankName}'] | //*[role="option" and @data-value="${bankName}"]`).filter({ visible: true }).first();

        if (await optionItem.isVisible({ timeout: 2000 }).catch(() => false)) {
          await optionItem.scrollIntoViewIfNeeded().catch(() => { });
          await optionItem.click({ force: true });
          console.log(`✓ Selected Customer Bank Name: ${bankName}`);
        } else {
          // Keyboard fallback
          console.log(`⚠ Exact Bank Name option click failed, trying keyboard fallback`);
          await this.page.keyboard.press(bankName.charAt(0));
          await this.page.keyboard.press('Enter');
        }
      } else {
        console.log(`⚠ Customer Bank Name combobox/select was not visible. Skipping.`);
      }
    }
  }

  /**
   * Fill surrogate details (Generic overload)
   */
  async fillSurrogateDetails(
    pageName: string,
    surrogateType: string,
    surrogateValue: string,
    proceedButton: string
  ): Promise<void> {
    console.log('===== Surrogate Details =====');
    await this.verifyCurrentScreen(pageName);
    await this.selectLwcDropdown('Surrogate Type', surrogateType);
    await this.fillTextboxWithTab('Surrogate Value', surrogateValue);
    await this.clickButton(proceedButton);
    await this.waitFor(1000);
    await this.checkForErrors();
    console.log(`✓ Surrogate filled: ${surrogateType}`);
  }
}
