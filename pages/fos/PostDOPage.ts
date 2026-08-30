import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { DataGenerator } from '../../utils';
import path from 'path';

/**
 * POST DO Page Object
 * Handles DO details, other details, agreement, invoice, and document library sections
 */
export class PostDOPage extends BasePage {
  private ecsBarcode: string;
  private fileBarcode: string;
  private invoiceDate: string;

  constructor(page: Page) {
    super(page);
    this.ecsBarcode = DataGenerator.generateECSBarcode();
    this.fileBarcode = DataGenerator.generateFileBarcode();
    this.invoiceDate = DataGenerator.getToday();
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

  // ==================== POST DO Flow Methods ====================

  /**
   * Proceed through DO details section
   */
  async proceedDODetailsSection(expectedValue: string, continueButtonValue: string): Promise<void> {
    await this.getPageNameValue(expectedValue);
    await this.clickButton(continueButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Proceed through other details section
   */
  async proceedOtherDetailsSection(
    expectedValue: string,
    ecsBarcodeLabel: string,
    fileBarcodeLabel: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Enter ECS BarCode, File BarCode in Other Details Section =====');
    await this.getPageNameValue(expectedValue);
    await this.actions.fill(
      this.page.locator(`//h1[text()='${ecsBarcodeLabel}']//..//input`),
      this.ecsBarcode,
      'Enter ECS Barcode'
    );
    console.log(`✓ Entered ${this.ecsBarcode} into ECS Bar Code`);
    await this.actions.fill(
      this.page.locator(`//h1[text()='${fileBarcodeLabel}']//..//input`),
      this.fileBarcode,
      'Enter File Barcode'
    );
    console.log(`✓ Entered ${this.fileBarcode} into File Bar Code`);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Proceed through agreement section
   */
  async proceedAgreementSection(
    expectedValue: string,
    continueButtonValue: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Proceed Agreement Section =====');
    await this.getPageNameValue(expectedValue);
    await this.clickButton(continueButtonValue);
    await this.waitFor(500);
    await this.clickButton('X');
    await this.waitFor(100);
    await this.actions.click(this.page.locator('span.slds-checkbox_faux'), 'Select checkbox');
    await this.actions.click(this.page.getByText('Initiate on 3-in-1', { exact: true }), 'Click Initiate on 3-in-1');
    await this.waitFor(500);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.clickButton(proceedButtonValue);
    await this.waitFor(1000);
    await this.checkForErrorAndFail();
  }

  /**
   * Enter invoice date
   */
  async enterInvoiceDate(labelName: string, dateValue: string): Promise<void> {
    const selector = `xpath=//input[@type='date']`;
    const dateInput = this.page.locator(selector);
    await dateInput.waitFor({ state: 'visible', timeout: 10000 });
    await dateInput.scrollIntoViewIfNeeded();
    
    const [day] = dateValue.split('-');
    await dateInput.focus();
    await dateInput.type(day);
    console.log(`✓ Entered ${dateValue} into ${labelName}`);
  }

  /**
   * Enter details in invoice section
   */
  async enterDetailsInInvoiceSection(
    expectedValue: string,
    invoiceDateLabel: string,
    proceedButtonValue: string
  ): Promise<void> {
    console.log('===== Enter Invoice Number & Proceed Invoice Section =====');
    await this.getPageNameValue(expectedValue);
    await this.enterInvoiceDate(invoiceDateLabel, this.invoiceDate);
    await this.actions.fill(
      this.page.locator("//label[text()='Invoice Number:  ']//..//input"),
      DataGenerator.generateMobileNumber(),
      'Enter Invoice Number'
    );
    console.log('✓ Entered Invoice Number value in Invoice section');
    await this.actions.click(this.page.locator('span.slds-checkbox_faux'), 'Select checkbox');
    await this.actions.click(this.page.locator('button').filter({ hasText: 'Proceed' }).first(), 'Click Proceed');
    console.log(`✓ Clicked on button: ${proceedButtonValue}`);
    await this.checkForErrorAndFail();
    await this.waitFor(10000);
    await this.actions.click(this.page.locator('button').filter({ hasText: 'Proceed' }).first(), 'Click Proceed');
    console.log(`✓ Clicked on button: ${proceedButtonValue}`);
    await this.checkForErrorAndFail();
    await this.waitFor(10000);
  }

  /**
   * Click on document label
   */
  async clickOnDocument(label: string): Promise<void> {
    await this.actions.click(this.page.getByText(label, { exact: true }), `Click ${label}`);
    console.log(`✓ Clicked on: ${label} Document`);
  }

  /**
   * Upload file
   */
  async uploadFiles(label: string, index: number, fileName: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'uploaddocuments', fileName);
      const [fileChooser] = await Promise.all([
        this.page.waitForEvent('filechooser'),
        this.page.getByText('Choose File').nth(index).click()
      ]);
      await fileChooser.setFiles(filePath);
      console.log(`✓ Uploaded ${fileName} file in ${label} Document`);
    } catch (error: any) {
      console.error(`Failed in uploadfiles: ${error.message}`);
    }
  }

  /**
   * Click save button for document
   */
  async clickOnSaveButton(label: string): Promise<void> {
    await this.actions.click(
      this.page.locator(`//div//span[text()='${label}']//..//..//button[text()='Save']`),
      'Click Save'
    );
  }

  /**
   * Upload documents in document library section
   */
  async uploadDocumentsInDocumentLibrary(
    expectedValue: string,
    ecsMandateLabel: string,
    ecsMandateFilename: string,
    invoiceLabel: string,
    invoiceFilename: string
  ): Promise<void> {
    console.log('===== Upload Documents in Document Library Section =====');
    await this.getPageNameValue(expectedValue);
    
    await this.clickOnDocument(ecsMandateLabel);
    await this.uploadFiles(ecsMandateLabel, 3, ecsMandateFilename);
    console.log(`✓ Uploaded ${ecsMandateFilename} document for ${ecsMandateLabel} in Document Library section`);
    await this.waitFor(20000);
    
    await this.clickOnDocument(invoiceLabel);
    await this.uploadFiles(invoiceLabel, 4, invoiceFilename);
    console.log(`✓ Uploaded ${invoiceFilename} document for ${invoiceLabel} in Document Library section`);
    await this.waitFor(20000);
  }
}
