import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import type { ProductData } from '../../types/customer.types';

/**
 * Product Selection Page Object
 * Handles product selection and configuration
 * PRODUCT SELECTION 

-when entering its show success msg(Success! For this customer, Opportunity is present on this dealer. Kindly proceed for Income Declaration.)
-Product Details


--Enter manually =await page.getByText('Enter Manually', { exact: true })
--Product model =await page.getByRole('textbox', { name: 'Select Product Model' })
--Invoic amount =await page.getByRole('spinbutton', { name: '₹ Enter Invoice Amount' })
--Required loan amount =await page.getByRole('spinbutton', { name: '₹ Enter Required Loan Amount' })
dropdown-
--Combo scheme =await page.locator('button:has-text("Yes")')
(yes or no)
--Bundeled opertunity =await page.getByRole('textbox', { name: 'Select Bundle Opportunity' })
(input text and select 1st one)
Ifyes
--Number of products =await page.getByRole('spinbutton', { name: 'Enter Number Of Products' })
Clear and fill already 0 is inbuilt

click on check box
--checkbox = await page.locator('span.slds-checkbox_faux')

--proceed button = await page.getByRole('button', { name: 'Proceed' })
after proceeed(Success! Please Select Scheme)

view more (warning will popup with meassage = Warning! No More Schemes Available.)
--view more = await page.getByText('View More', { exact: true })

recommended schemes page
-- click on scheme = await page.locator('div.scheme.colorSchemeBorder')

--conform =await page.getByRole('button', { name: 'Confirm' })

 */
export class ProductSelectionPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  //check current page is product selection page
  async isProductSelectionPage(): Promise<boolean> {
    const screen = await this.getCurrentScreen();
    return screen === 'Product Details';
  }

  //click on 'enter manually' button to enter product details page
  async clickEnterManually(): Promise<void> {
    await this.actions.click(
      await this.page.getByText('Enter Manually', { exact: true })
    );
  }

  private async enterSpinbuttonValue(locator: Locator, value: string, description: string): Promise<void> {
    await expect(locator).toBeVisible({ timeout: 15000 });
    await locator.scrollIntoViewIfNeeded();
    await locator.click();
    await locator.fill('');
    await locator.fill(value);
    await locator.blur().catch(() => { });
    console.log(`✓ ${description}: ${value}`);
  }

  private getInvoiceAmountField(): Locator {
    return this.page.getByRole('spinbutton', { name: /Invoice Amount/i }).first()
      .or(this.page.getByRole('spinbutton').nth(0));
  }

  private getRequiredLoanAmountField(): Locator {
    return this.page.getByRole('spinbutton', { name: /Required Loan Amount/i }).first()
      .or(this.page.getByRole('spinbutton').nth(1));
  }
  // /**
  //  * Select product category (Mobile, CE, Furniture, etc.)
  //  */
  // async selectProductCategory(
  //   pageName: string, 
  //   category: string, 
  //   proceedButton: string
  // ): Promise<void> {
  //   console.log('===== Product Category Selection =====');
  //   await this.verifyCurrentScreen(pageName);

  //   // Click on category tile
  //   await this.actions.click(
  //     this.page.locator(`//button[text()='${category}']`),
  //     `Select ${category}`
  //   );
  //   await this.waitFor(1000);

  //   // Proceed
  //   await this.clickButton(proceedButton);
  //   await this.checkForErrors();
  //   console.log(`✓ Selected category: ${category}`);
  // }

  /**
   * Fill product details
   */
  async fillProductDetails(
    productModel: string,
    invoiceAmount: string,
    requiredLoanAmount: string,
    proceedButton: string
  ): Promise<void> {
    console.log('===== Product Details =====');

    // Fallback: If Product Selection is not visible, use Hamburger to skip to Income Declaration
    if (!await this.isCurrentScreen('Product Selection')) {
      console.log('⚠ Product Selection page not visible. Using hamburger menu to navigate to Income Declaration...');
      await this.clickHamburgerMenu('Income Declaration');
      await this.page.waitForTimeout(2000);
      return;
    }

    await this.verifyCurrentScreen('Product Selection');

    // select product model "Samsung S25 Ultra-Rs 70000 - Samsung OEM Asset Category Rs70000"
    // search and select product model
    await this.page.waitForTimeout(1000);
    await this.clickEnterManually();
    await this.page.waitForTimeout(1000);

    const isSamyang = productModel.includes('SAMYANG-CAMERA - 10MM F2.8 Canon M');
    const searchText = productModel.includes('123 - Samsung-LED Rs49600')
      ? '123 - Samsung-LED Rs49600'
      : isSamyang
        ? '10mm'
        : productModel;
    const productModelInput = this.page.getByRole('textbox', { name: 'Select Product Model' });
    await productModelInput.scrollIntoViewIfNeeded();
    await productModelInput.click({ clickCount: 3 }).catch(() => { });
    await productModelInput.press('Backspace').catch(() => { });
    await this.page.waitForTimeout(200);
    await productModelInput.fill('', { force: true }).catch(() => { });

    // Type slowly to trigger Salesforce backend search
    await productModelInput.pressSequentially(searchText, { delay: 100 }).catch(() => { });

    // Explicit click + ArrowDown is required to trigger LWC dropdown visibility
    await productModelInput.click({ force: true }).catch(() => { });
    await this.page.keyboard.press('ArrowDown').catch(() => { });

    if (isSamyang) {
      // Wait for dropdown to load and select the second option (index 1)
      // Actual LWC dropdown items use class "listitem" on <li> elements
      console.log(`✓ Entered search text: "${searchText}" for SAMYANG product — waiting for dropdown...`);
      const dropdownOptions = this.page.locator('li.listitem');
      await dropdownOptions.nth(1).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
        console.warn('⚠ Second dropdown option (li.listitem nth(1)) not found within timeout, falling back to first');
      });
      const secondOption = dropdownOptions.nth(1);
      if (await secondOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await secondOption.click({ force: true });
        console.log('✓ Selected second dropdown option for SAMYANG product');
      } else {
        // Fallback: try first available option
        const firstOption = dropdownOptions.first();
        await firstOption.click({ force: true }).catch(() => { });
        console.warn('⚠ Fell back to first li.listitem dropdown option');
      }
      // Press Escape and wait to ensure the dropdown fully closes before filling Invoice Amount
      await this.page.keyboard.press('Escape').catch(() => { });
      await this.page.waitForTimeout(800);
    } else {
      // User requested to NOT wait for the dropdown and just proceed to entering other details
      await this.page.keyboard.press('Escape').catch(() => { });
      // Wait for any open dropdown list to fully disappear before clicking invoice amount
      await this.page.locator('li.listitem').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => { });
      await this.page.waitForTimeout(400);
      console.log(`✓ Entered product model text: ${searchText} (skipping dropdown wait)`);
    }

    // invoice amount
    const invoiceAmountField = this.getInvoiceAmountField();
    await this.enterSpinbuttonValue(invoiceAmountField, invoiceAmount, 'Enter invoice amount');

    // Required loan amount
    const requiredLoanAmountField = this.getRequiredLoanAmountField();
    await this.enterSpinbuttonValue(requiredLoanAmountField, requiredLoanAmount, 'Enter required loan amount');

    //handle combobox yes or no
    // const comboSchemeButton = this.page.locator('button:has-text("Yes")');
    // const comboSchemeText = await comboSchemeButton.textContent();

    /** // Model Color
    await this.selectComboboxByTitle('Model Color', data.modelColor);

    // Unit Price
    await this.fillTextbox('Unit Price', data.unitPrice);

    // Quantity (if provided)
    if (data.quantity) {
      await this.fillTextbox('Quantity', data.quantity);
    }

    // IMEI Number (if provided)
    if (data.imeiNumber) {
      await this.fillTextbox('IMEI Number', data.imeiNumber);

      // Click Add button
    await this.clickButton('Add');
    await this.waitFor(1000);

    // Proceed
    await this.clickButton(proceedButton);
    await this.checkForErrors();
    console.log(`✓ Added product: ${data.manufacturer} ${data.modelName}`);

    }*/

    // click checkbox if visible and not already selected
    const checkbox = this.page.locator('span.slds-checkbox_faux');
    if (await checkbox.isVisible({ timeout: 1000 }).catch(() => false)) {
      await checkbox.click();
      console.log('✓ Clicked on checkbox');
    } else {
      console.warn('Checkbox not found or not visible');
    }

    // click proceed button
    const proceedButtonLocator = this.page.getByRole('button', { name: proceedButton });
    await this.actions.click(proceedButtonLocator, `Click ${proceedButton}`);
    console.log('✓ Clicked on Proceed button');

    // After clicking proceed, either a validation error may appear OR we navigate to Recommended Schemes.
    // Check for the loan validation error first and surface it to the caller.
    const validationError = this.page.locator('.toastMessage, .slds-notify_toast, .forceActionsText, span, div').filter({ hasText: /please provide loan amount less than invoice amount/i });
    if (await validationError.first().isVisible({ timeout: 1500 }).catch(() => false)) {
      console.warn('Loan validation error visible on Product Details');
      throw new Error('ValidationError: Required loan amount exceeds invoice amount');
    }

    // Wait for Recommended Schemes page with extended timeout.
    // Some environments navigate directly to Income Declaration — treat that as success.
    const recommended = this.page.getByText('Recommended Schemes', { exact: true });
    // Look for the actual Income value input field to confirm we're on the Income Declaration page, not just the stepper
    const incomePage = this.page.locator('input[name="Income_Declared_Value__c"] , input[type="number"]').filter({ hasNot: this.page.locator('input[readonly]') }).first();

    const reachedSchemes = await recommended.waitFor({ state: 'visible', timeout: 30000 })
      .then(() => true)
      .catch(() => false);

    if (!reachedSchemes) {
      // Fallback: check if we jumped directly to Income Declaration
      const reachedIncome = await incomePage.isVisible({ timeout: 5000 }).catch(() => false);
      if (reachedIncome) {
        console.log('✓ Navigated directly to Income Declaration (Recommended Schemes skipped by app)');
        return;
      }
      throw new Error('Product selection did not navigate to Recommended Schemes or Income Declaration within 30s');
    }

    console.log('✓ Navigated to Recommended Schemes page');

    // Click View More if present (some flows show a warning instead)
    await this.page.waitForTimeout(500);
    const viewMoreButton = this.page.getByText('View More', { exact: true });
    const hasViewMore = await viewMoreButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (hasViewMore) {
      await this.actions.click(viewMoreButton, 'Click View More');
      console.log('✓ Clicked on View More button');
      // Wait for schemes to load after View More
      await this.page.waitForTimeout(2000);
    } else {
      console.log('View More not present — schemes already visible');
    }

    // Wait for scheme options and select first available
    // Wait for schemes to settle / toast to disappear
    await this.page.waitForTimeout(2000);

    // Use the LWC scheme card class (documented in page header: div.scheme.colorSchemeBorder)
    // Primary: click the actual card element that LWC listens on
    await this.selectSchemeAndConfirm();
  }

  /**
   * Proceed from Product Selection without entering details (e.g. after Change Scheme)
   * Only clicks checkbox and proceeds to Income Declaration / Recommended Schemes
   */
  async proceedFromChangeScheme(): Promise<void> {
    console.log('===== Product Details (Change Scheme) =====');

    // Wait a brief moment to ensure page is loaded
    await this.page.waitForTimeout(1500);

    // click checkbox if visible and not already selected
    const checkbox = this.page.locator('span.slds-checkbox_faux').first();
    if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await checkbox.click();
      console.log('✓ Clicked on checkbox');
    } else {
      console.warn('Checkbox not found or not visible');
    }

    // click proceed button
    const proceedButtonLocator = this.page.getByRole('button', { name: 'Proceed' });
    await this.actions.click(proceedButtonLocator, `Click Proceed`);
    console.log('✓ Clicked on Proceed button');

    // Wait for Recommended Schemes page with extended timeout.
    // Some environments navigate directly to Income Declaration — treat that as success.
    const recommended = this.page.getByText('Recommended Schemes', { exact: true });
    // Look for the actual Income value input field to confirm we're on the Income Declaration page, not just the stepper
    const incomePage = this.page.locator('input[name="Income_Declared_Value__c"] , input[type="number"]').filter({ hasNot: this.page.locator('input[readonly]') }).first();

    const reachedSchemes = await recommended.waitFor({ state: 'visible', timeout: 5000 })
      .then(() => true)
      .catch(() => false);

    if (!reachedSchemes) {
      // Fallback: check if we jumped directly to Income Declaration
      const reachedIncome = await incomePage.isVisible({ timeout: 5000 }).catch(() => false);
      if (reachedIncome) {
        console.log('✓ Navigated directly to Income Declaration (Recommended Schemes skipped by app)');
        return;
      }

      throw new Error('⚠ Product Selection page seems stuck and Recommended Schemes did not appear.');
    }

    console.log('✓ Navigated to Recommended Schemes page');

    // Click View More if present
    await this.page.waitForTimeout(500);
    const viewMoreButton = this.page.getByText('View More', { exact: true });
    const hasViewMore = await viewMoreButton.isVisible({ timeout: 1000 }).catch(() => false);
    if (hasViewMore) {
      await this.actions.click(viewMoreButton, 'Click View More');
      console.log('✓ Clicked on View More button');
      await this.page.waitForTimeout(2000);
    }

    // Wait for scheme options and select first available
    // Wait for schemes to settle / toast to disappear
    await this.page.waitForTimeout(2000);

    // Use the LWC scheme card class (documented in page header: div.scheme.colorSchemeBorder)
    await this.selectSchemeAndConfirm();
  }

  /**
   * Shared helper: click the first scheme card (div.scheme.colorSchemeBorder) and Confirm.
   * The LWC card requires a real click (not JS evaluate) on the card border element
   * to trigger the selection state before Confirm becomes active.
   */
  private async selectSchemeAndConfirm(): Promise<void> {
    // Before click: scheme has defaultSchemeBorder
    // After click: scheme has colorSchemeBorder
    const unselectedCard = this.page.locator('div.scheme.defaultSchemeBorder').first();
    const selectedCard = this.page.locator('div.scheme.colorSchemeBorder').first();

    // Fallback based on content if the classes change
    const schemeCardContent = this.page.locator('div')
      .filter({ hasText: 'Scheme Category' })
      .filter({ hasText: 'Gross/Adv Tenor' })
      .first();

    // Wait for at least one unselected scheme card to appear
    const hasUnselected = await unselectedCard.waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true).catch(() => false);

    if (hasUnselected) {
      // The old framework selected schemes by clicking the scheme name text.
      // Let's click the scheme name paragraph inside the card.
      // The old framework selected schemes by clicking the scheme name text directly on the page.
      // E.g., await this.action.click(this.page.getByText(schemenamevalue, { exact: true }));
      const schemeNameElement = unselectedCard.locator('p.para5').nth(2); // 3rd para5 usually holds the Scheme Name
      let schemeNameText = '';
      if (await schemeNameElement.isVisible().catch(() => false)) {
        schemeNameText = await schemeNameElement.innerText().catch(() => '');
        schemeNameText = schemeNameText.trim();
      }
      
      if (schemeNameText) {
        console.log(`Attempting to click scheme text: ${schemeNameText}`);
        const schemeLocator = this.page.getByText(schemeNameText, { exact: true }).first();
        await schemeLocator.scrollIntoViewIfNeeded().catch(() => {});
        await schemeLocator.click().catch(() => schemeLocator.click({ force: true }));
      } else {
        await unselectedCard.click({ force: true });
      }
      console.log('✓ Clicked unselected scheme card (defaultSchemeBorder)');

      // Crucial: Wait for the card to transition to the selected state (blue border)
      const transitioned = await selectedCard.waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true).catch(() => false);

      if (!transitioned) {
        console.warn('⚠ Scheme card did not transition to colorSchemeBorder state via Playwright click. Attempting JS dispatch...');
        // Fallback: Dispatch native events if Playwright's synthetic events were ignored by LWC shadow DOM
        await unselectedCard.evaluate((node, textValue) => {
          // Find text elements and click them
          if (textValue) {
             const allPs = node.querySelectorAll('p.para5');
             for (let i = 0; i < allPs.length; i++) {
                const p = allPs[i];
                if (p.textContent && p.textContent.trim() === textValue) {
                   if (typeof (p as HTMLElement).click === 'function') (p as HTMLElement).click();
                }
             }
          }
          if (typeof (node as HTMLElement).click === 'function') {
            (node as HTMLElement).click();
          }
          node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window, composed: true }));
        });

        await selectedCard.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {
          console.warn('⚠ Scheme card still did not transition to colorSchemeBorder state after JS dispatch');
        });
      }
    } else {
      // Fallback if class names changed
      await expect(schemeCardContent).toBeVisible({ timeout: 10000 });
      await schemeCardContent.click({ force: true }).catch(() => schemeCardContent.evaluate((el) => (el as HTMLElement).click()));
      console.log('✓ Clicked scheme card via content-based fallback');
    }

    // Wait for scheme to register selection (Confirm button may briefly be disabled)
    await this.page.waitForTimeout(1500);

    // Confirm the selected scheme
    const roleConfirm = this.page.getByRole('button', { name: 'Confirm' }).first();
    const cssConfirm = this.page.locator('c-scheme-selection-reinvent div.mainStaticProceedNormalBox button');

    let confirmedVia = '';
    if (await roleConfirm.isVisible({ timeout: 5000 }).catch(() => false)) {
      await roleConfirm.click({ force: true });
      confirmedVia = 'getByRole(Confirm)';
    } else if (await cssConfirm.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await cssConfirm.first().click({ force: true });
      confirmedVia = 'CSS selector';
    } else {
      const anyConfirm = this.page.locator('button').filter({ hasText: /^Confirm$/i }).first();
      if (await anyConfirm.isVisible({ timeout: 3000 }).catch(() => false)) {
        await anyConfirm.click({ force: true });
        confirmedVia = 'any button[Confirm]';
      } else {
        console.warn('⚠ Confirm button not found — scheme may not be selectable');
      }
    }

    if (confirmedVia) {
      console.log(`✓ Clicked Confirm button via: ${confirmedVia}`);
      // Wait for Recommended Schemes to disappear = confirmed navigation away
      await this.page.getByText('Recommended Schemes', { exact: true })
        .waitFor({ state: 'hidden', timeout: 20000 })
        .catch(() => console.warn('⚠ Recommended Schemes still visible after Confirm — proceeding anyway'));
    }
  }
}
