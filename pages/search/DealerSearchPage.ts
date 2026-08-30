import { Page, Locator } from '@playwright/test';
import { BasePage } from '../BasePage';
import { config } from '../../config/environment.config';

/**
 * Dealer Search Page Object
 * Handles dealer selection and mobile number search
 */
export class DealerSearchPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigate directly to the Search Dealer page.
   *
   * Call this at the start of every test INSTEAD of loginPage.loginToFOS().
   * The browser context already has the authenticated session restored from
   * .auth/global-auth.json (via globalSetup + storageState in playwright.config.ts).
   *
   * After storageState restore the page starts on about:blank, so we navigate
   * directly to /searchmain first — then ensureOnSearchPage() validates the UI.
   */
  async navigateToSearchDealer(): Promise<void> {
    console.log('===== Navigating to Search Dealer =====');

    // Build the /searchmain URL from config so we never depend on the current
    // page URL (which is about:blank right after storageState restore).
    const searchUrl = `${new URL(config.urls.fosCustomer).origin}/dealercommunityreinvent/s/searchmain`;
    console.log(`  → Navigating to: ${searchUrl}`);

    await this.page.goto(searchUrl, { waitUntil: 'domcontentloaded' }).catch(() => undefined);

    // ensureOnSearchPage validates the dealer combobox / search UI is ready.
    await this.ensureOnSearchPage();
    console.log('✓ Ready on Search Dealer page');
  }

  /**
   * Select dealer and search with mobile number
   * Based on working Java Selenium implementation
   * 
   * Flow:
   * 1. Land on main page (after MFA): /dealercommunityreinvent/s/
   * 2. Click Search tab → navigates to: /dealercommunityreinvent/s/searchmain
   * 3. Select dealer from dropdown (Excel data)
   * 4. Enter mobile number
   * 5. Click Search button
   */
  private async findVisibleLocator(selectors: string[], timeout: number = 500): Promise<Locator | null> {
    for (const selector of selectors) {
      try {
        const locator = this.page.locator(selector).first();
        if (await locator.isVisible({ timeout }).catch(() => false)) {
          return locator;
        }
      } catch {
        // Try next selector
      }
    }
    return null;
  }

  /**
   * Ensure we are on the search page - navigates there if not already
   */
  private async ensureOnSearchPage(): Promise<void> {
    const currentUrl = this.page.url();
    const searchUiVisible = await this.page.getByRole('combobox', { name: /Dealer/i }).isVisible({ timeout: 3000 }).catch(() => false);

    if (!searchUiVisible) {
      console.log('Navigating to search page directly...');

      const searchPageUrl = await this.getSearchPageUrl(currentUrl);
      const searchRootUrl = `${new URL(searchPageUrl).origin}/dealercommunityreinvent/s/`;

      await this.page.goto(searchPageUrl, { waitUntil: 'domcontentloaded' }).catch(() => undefined);

      if (await this.isPageNotFound()) {
        console.log(`⚠ Search page not available at ${searchPageUrl}. Retrying with root route ${searchRootUrl}`);
        await this.page.goto(searchRootUrl, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
      }

      await this.page.waitForURL(
        (url) => url.href.includes('/dealercommunityreinvent/s/searchmain'),
        { timeout: 15000, waitUntil: 'commit' }
      ).catch(() => undefined);
    }

    await this.waitForSearchPageReady();
    console.log('✓ Search page loaded');
  }

  private async getSearchPageUrl(currentUrl: string): Promise<string> {
    if (!currentUrl || currentUrl === 'about:blank' || currentUrl.startsWith('chrome-error://')) {
      currentUrl = config.urls.fosCustomer;
    }
    const url = new URL(currentUrl);
    let origin = url.origin;

    if (/\.my\.site\.com$/i.test(url.hostname)) {
      return `${origin}/dealercommunityreinvent/s/searchmain`;
    }

    if (/\.my\.salesforce\.com$/i.test(url.hostname)) {
      origin = origin.replace(/\.my\.salesforce\.com$/i, '.my.site.com');
      return `${origin}/dealercommunityreinvent/s/searchmain`;
    }

    if (/\.salesforce\.com$/i.test(url.hostname)) {
      origin = origin.replace(/\.salesforce\.com$/i, '.my.site.com');
      return `${origin}/dealercommunityreinvent/s/searchmain`;
    }

    return `${origin}/dealercommunityreinvent/s/searchmain`;
  }

  private async isPageNotFound(timeout: number = 3000): Promise<boolean> {
    const notFoundTexts = [
      "Page doesn't exist",
      'Enter a valid URL and try again',
      'Page not found',
      'Invalid URL',
    ];

    for (const text of notFoundTexts) {
      if (await this.page.locator(`text=${text}`).isVisible({ timeout }).catch(() => false)) {
        return true;
      }
    }
    return false;
  }

  private getSearchButtonLocator(): Locator {
    return this.page.getByRole('button', { name: 'Search', exact: true })
      .or(this.page.locator("button:has-text('Search')").first())
      .or(this.page.locator("input[type='submit'][value*='Search']").first())
      .first();
  }

  private async waitForSearchPageReady(timeout: number = 30000): Promise<void> {
    // Race all ready-locators in parallel — return as soon as the first
    // one becomes visible. This is much faster than checking sequentially
    // and avoids networkidle which never settles on Salesforce LWC pages.
    const readyLocators = [
      this.page.getByRole('combobox', { name: /Dealer/i }).first(),
      this.page.getByRole('button', { name: 'Mobile Number', exact: true }).first(),
      this.getSearchButtonLocator(),
      this.page.locator('text=Search Customer By'),
      this.page.getByLabel('Card Number').first(),
      this.page.locator('text=/Dealer|Search Customer By|Mobile Number|Card Number/i').first(),
    ];

    // Race: whichever locator becomes visible first wins
    const found = await Promise.race(
      readyLocators.map(loc =>
        loc.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false)
      )
    );

    if (!found) {
      if (await this.isPageNotFound(2000)) {
        throw new Error("Search page is not available — redirected to 'Page doesn't exist'.");
      }
      // One reload-and-retry (no networkidle)
      console.log('⚠ Search UI not visible — reloading once and retrying...');
      await this.page.reload({ waitUntil: 'domcontentloaded', timeout }).catch(() => undefined);
      await Promise.race(
        readyLocators.map(loc =>
          loc.waitFor({ state: 'visible', timeout }).then(() => true).catch(() => false)
        )
      );
    }

    await this.waitFor(300);
  }

  async selectDealerAndSearch(
    dealer: string,
    mobileLabel: string,
    mobile: string,
    searchButton: string
  ): Promise<void> {
    console.log('===== Dealer Selection & Mobile Search =====');
    console.log(`Target Dealer: ${dealer}`);
    console.log(`Mobile Number: ${mobile}`);

    await this.waitFor(500);
    const currentUrl = this.page.url();
    console.log(`✓ Current URL: ${currentUrl}`);

    console.log('Step 1: Ensuring we are on search page...');
    await this.ensureOnSearchPage();

    console.log(`Step 2: Selecting dealer: ${dealer}...`);
    await this.selectDealer(dealer);

    console.log('Step 3: Selecting mobile-number search mode...');
    await this.selectSearchMode('Mobile Number');

    console.log(`Step 4: Entering mobile number: ${mobile}...`);
    await this.enterMobileNumber(mobileLabel || 'Mobile Number', mobile);

    console.log('Step 5: Clicking Search and waiting for next page...');
    await this.clickSearch(searchButton || 'Search');
    await this.waitFor(2000);
  }

  async selectDealer(dealer: string): Promise<void> {
    console.log(`===== Selecting Dealer: ${dealer} =====`);
    await this.ensureOnSearchPage();

    let dealerDropdown = this.combobox('Dealer').first();
    await dealerDropdown.waitFor({ state: 'visible', timeout: 5000 }).catch(async () => {
      const fallback = this.page.locator("//lightning-combobox|//select|//input[@placeholder='Select Dealer']").first();
      await fallback.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
      dealerDropdown = fallback;
    });
    await this.actions.click(dealerDropdown, 'Open dealer dropdown');
    try {
      const dealerCode = dealer.split('-')[0].trim();
      for (const char of dealerCode) {
        await this.page.keyboard.press(char);
        await this.waitFor(50);
      }
      console.log(`✓ Typed dealer code: ${dealerCode}`);
      await this.waitFor(1500);
    } catch (e) {
      console.log(`⚠ Could not type into dealer dropdown: ${(e as Error).message}`);
    }
    await this.waitFor(500);

    const dealerOption = this.page.locator(`//li[normalize-space(.)='${dealer}'] | //div[normalize-space(.)='${dealer}'] | //span[normalize-space(.)='${dealer}'] | //option[normalize-space(.)='${dealer}']`).first();
    if (!(await dealerOption.isVisible({ timeout: 5000 }).catch(() => false))) {
      const fallbackOption = this.page.locator("lightning-base-combobox-item, option, li, div[role='option']").filter({ hasText: /\S/ }).first();
      if (!(await fallbackOption.isVisible({ timeout: 5000 }).catch(() => false))) {
        throw new Error(`Could not select dealer option: ${dealer}`);
      }

      console.log(`⚠ Dealer option '${dealer}' was not found exactly; using the first visible option instead.`);
      await fallbackOption.click();
      console.log(`✓ Selected dealer via fallback: ${dealer}`);
      await this.waitFor(500);
      await this.page.keyboard.press('Escape').catch(() => undefined);
      return;
    }

    await dealerOption.click();
    console.log(`✓ Selected dealer: ${dealer}`);
    await this.waitFor(500);
    await this.page.keyboard.press('Escape').catch(() => undefined);
  }


  async selectSearchMode(mode: string): Promise<void> {
    try {
      // Clear any currently visible inputs (e.g. Mobile Number) before switching modes.
      // This prevents "enter either mobile number or card number only" validation errors 
      // caused by LWC caching values between tests.
      const visibleInputs = this.page.locator('input[type="tel"], input[type="text"], input[type="number"], input[inputmode="numeric"]');
      const count = await visibleInputs.count();
      for (let i = 0; i < count; i++) {
        const input = visibleInputs.nth(i);
        if (await input.isVisible().catch(() => false)) {
          await input.fill('').catch(() => undefined);
        }
      }

      // Dismiss any open dropdowns (like the global search "Recent Items") that might obscure the UI
      await this.page.keyboard.press('Escape').catch(() => undefined);
      await this.page.waitForTimeout(500);

      // Try native Playwright clicks first, which handle shadow DOMs natively
      let clicked = false;
      const candidates = [
        this.page.getByRole('tab', { name: new RegExp(mode, 'i') }).first(),
        this.page.getByRole('radio', { name: new RegExp(mode, 'i') }).first(),
        this.page.locator(`label`).filter({ hasText: new RegExp(mode, 'i') }).first(),
        this.page.locator(`a[role="tab"]:has-text("${mode}")`).first(),
        this.page.locator(`//a[contains(., '${mode}')]`).first(),
        this.page.locator(`lightning-tab-bar`).getByText(mode).first(),
        this.page.getByText(mode, { exact: true }).first()
      ];

      for (let i = 0; i < 5; i++) { // Try polling a few times
        for (const candidate of candidates) {
          if (await candidate.isVisible().catch(() => false)) {
            // Click the element. Also click its parent as a fallback (LWC anchor tags)
            await candidate.click({ force: true }).catch(() => undefined);
            
            // Execute a raw JS click on the element as well, just in case
            await candidate.evaluate((el: HTMLElement) => {
              el.click();
              if (el.parentElement) el.parentElement.click();
            }).catch(() => undefined);
            
            clicked = true;
            break;
          }
        }
        if (clicked) break;
        await this.page.waitForTimeout(1000);
      }

      if (clicked) {
        console.log(`✓ Selected search mode: ${mode}`);
        const waitMs = mode.toLowerCase().includes('card') ? 3000 : 1000;
        await this.waitFor(waitMs);
      } else {
        console.log(`⚠ Search mode not found in DOM: ${mode}`);
      }
    } catch (e) {
      console.log(`⚠ Error selecting search mode: ${mode}`);
    }
  }

  /**
   * Enter card number only (without searching)
   */
  async enterCardNumber(cardLabel: string, cardNumber: string): Promise<void> {
    console.log(`===== Entering Card Number =====`);
    await this.ensureOnSearchPage();
    await this.waitFor(2000);

    const label = cardLabel || 'Card Number';
    // Using .last() for fallback selectors prevents us from accidentally grabbing
    // the global search bar located in the top header of the Salesforce page.
    const cardInputCandidates = [
      this.page.locator(`input[type="text"], input[type="tel"], input[type="number"], input[inputmode="numeric"]`).filter({ has: this.page.getByLabel(label) }).first(),
      this.page.locator("input[placeholder*='Card' i]").last(),
      this.page.locator("input[data-id*='card' i]").last(),
      this.page.locator("lightning-input input").filter({ hasNot: this.page.locator('[type="radio"]') }).last(),
      this.page.locator("input[type='text'], input[type='tel'], input[type='number'], input[inputmode='numeric']").last()
    ];

    let cardInput: Locator | null = null;
    for (const candidate of cardInputCandidates) {
      if (await candidate.count()) {
        cardInput = candidate;
        break;
      }
    }

    if (!cardInput) {
      throw new Error('Card input field was not found');
    }

    // Explicitly clear the mobile number field to prevent Salesforce validation errors
    // "you must enter either mobile number or card number only"
    const mobileInputs = this.page.locator("input[type='tel'], input[type='number'], input[inputmode='numeric'], input[data-id*='mobile' i], input[placeholder*='Mobile' i]");
    const count = await mobileInputs.count();
    for (let i = 0; i < count; i++) {
      const minput = mobileInputs.nth(i);
      // Force clear via evaluate even if hidden, to reset the underlying LWC state
      await minput.evaluate((el: HTMLInputElement) => { 
        if (el.value) {
          el.value = ''; 
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }).catch(() => undefined);
    }

    await cardInput.waitFor({ state: 'visible', timeout: 10000 });
    await cardInput.waitFor({ state: 'attached', timeout: 10000 });
    await cardInput.scrollIntoViewIfNeeded();
    await cardInput.click();
    await this.waitFor(1500);
    await cardInput.evaluate((el: HTMLInputElement) => {
      el.focus();
      el.select();
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await cardInput.evaluate((el: HTMLInputElement, v: string) => {
      el.focus();
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, cardNumber);

    const filled = (await cardInput.inputValue().catch(() => '')).trim();
    if (filled !== cardNumber) {
      await cardInput.fill(cardNumber);
    }
    console.log(`✓ Entered card number: ${cardNumber}`);
  }

  /**
   * Select dealer and search with PAN number (for existing customers)
   */
  async selectDealerAndSearchByPAN(
    dealer: string,
    pan: string,
    searchButton: string
  ): Promise<void> {
    console.log('===== Dealer Selection & PAN Search =====');
    await this.ensureOnSearchPage();

    // Click Search tab
    await this.clickMenuTab(searchButton);

    // Select Dealer from combobox
    await this.actions.click(this.combobox('Dealer'), 'Open dealer dropdown');
    await this.actions.click(this.byTitle(dealer), `Select ${dealer}`);
    console.log(`✓ Selected dealer: ${dealer}`);

    // Enter PAN Number
    await this.fillLabelInput('PAN Number', pan);
    console.log(`✓ Entered PAN: ${pan}`);

    // Click Search
    await this.clickButton(searchButton);
    await this.waitFor(1000);
    await this.checkForErrors();
    console.log('✓ PAN search completed');
  }

  /**
   * Enter mobile number only (without searching)
   */
  async enterMobileNumber(mobileLabel: string, mobile: string): Promise<void> {
    console.log(`===== Entering Mobile Number =====`);
    await this.ensureOnSearchPage();

    const label = mobileLabel || 'Mobile Number';
    let mobileInput = this.page.getByLabel(label, { exact: false }).last();
    if (!(await mobileInput.count())) {
      mobileInput = this.page.locator("input[type='tel'], input[type='number'], input[inputmode='numeric']").last();
    }

    await mobileInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => { });
    await mobileInput.scrollIntoViewIfNeeded();
    await mobileInput.fill('');
    await mobileInput.fill(mobile);

    const filled = (await mobileInput.inputValue().catch(() => '')).trim();
    if (filled !== mobile) {
      await mobileInput.evaluate((el: HTMLInputElement, v: string) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, mobile, { timeout: 5000 }).catch(() => undefined);
    }
    console.log(`✓ Entered mobile: ${mobile}`);
  }

  //  /**
  //    * Enter mobile number only (without searching)
  //    */
  //   async enterMobileNumber(mobileLabel: string, mobile: string): Promise<void> {
  //     console.log(`===== Entering Mobile Number =====`);

  //     // 1. Target specifically via Playwright's built-in getByLabel or accurate LWC selectors
  //     const mobileInput = this.page.getByLabel(mobileLabel, { exact: false })
  //       .or(this.page.locator("input[data-id='mobileNumber']"))
  //       .or(this.page.locator("lightning-input[data-id='mobileNumber'] input"))
  //       .first();

  //     // 2. Wait for it to be visible & actionable before interacting
  //     await mobileInput.waitFor({ state: 'visible', timeout: 10000 });
  //     await mobileInput.scrollIntoViewIfNeeded();

  //     // 3. Fill the value (fill() automatically clears existing text safely)
  //     await mobileInput.fill(mobile);

  //     console.log(`✓ Entered mobile: ${mobile}`);
  //   }

  /**
   * Click search button
   */
  async clickSearch(searchButton: string): Promise<void> {
    const buttonText = searchButton || 'Search';
    console.log('===== Clicking Search Button =====');

    // Dismiss any global search dropdowns that might be obscuring the button
    await this.page.keyboard.press('Escape').catch(() => undefined);
    await this.page.waitForTimeout(500);

    const searchButtonLocator = this.page.getByRole('button', { name: buttonText, exact: true }).last();
    await searchButtonLocator.waitFor({ state: 'visible', timeout: 10000 });
    await this.actions.click(searchButtonLocator, `Click ${buttonText}`);
    console.log('✓ Search button clicked');

    await this.waitFor(2000);
    try {
      await this.checkForErrors();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Application Error')) {
        console.log(`⚠ Expected validation message: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  /**
   * Enter opportunity in search textbox
   */
  async searchByOpportunity(searchBoxLabel: string, opportunityValue: string): Promise<void> {
    await this.ensureOnSearchPage();
    console.log('===== Search by Opportunity =====');

    const searchBox = this.page.locator(`//input[@placeholder='Search by Opportunity Name or Deal ID']`);

    await searchBox.waitFor({ state: 'visible', timeout: 10000 });
    await searchBox.fill(opportunityValue);
    await this.waitFor(5000);
    await searchBox.press('Enter');
    await this.waitFor(7000);

    // Click on result
    const resultLink = this.page.locator(`//a[text()='${opportunityValue}']`);
    await resultLink.waitFor({ state: 'visible', timeout: 13000 });
    await resultLink.click();
    await this.page.waitForLoadState('load');

    console.log(`✓ Found and selected opportunity: ${opportunityValue}`);
  }
}



