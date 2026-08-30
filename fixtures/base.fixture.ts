import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/common/LoginPage';
import { DealerSearchPage, AppStatusPage } from '../pages/search';
import { ZipCodePage, MitcPage, KycPage, PoiPage, PoaPage, PanVerificationPage } from '../pages/customer-onboarding';
import { ProductSelectionPage, IncomeDeclarationPage } from '../pages/product';
import { SurrogateDetailsPage, ApprovalDetailsPage, AdditionalDetailsPage, ReappraisalPage, AssetCartPage } from '../pages/approval';
import { AdminCustomerPage } from '../pages/admin';

/**
 * Page Objects available in fixtures
 */
export interface PageObjects {
  // Common
  loginPage: LoginPage;
  
  // Search
  dealerSearchPage: DealerSearchPage;
  appStatusPage: AppStatusPage;
  
  // Customer Onboarding
  zipCodePage: ZipCodePage;
  mitcPage: MitcPage;
  kycPage: KycPage;
  poiPage: PoiPage;
  poaPage: PoaPage;
  panVerificationPage: PanVerificationPage;
  
  // Product
  productSelectionPage: ProductSelectionPage;
  incomeDeclarationPage: IncomeDeclarationPage;
  
  // Approval
  surrogateDetailsPage: SurrogateDetailsPage;
  approvalDetailsPage: ApprovalDetailsPage;
  additionalDetailsPage: AdditionalDetailsPage;
  reappraisalPage: ReappraisalPage;
  assetCartPage: AssetCartPage;
  
  // Admin
  adminCustomerPage: AdminCustomerPage;

  // Additional Data
  testData?: any;
}

/**
 * Extended test fixture with all page objects
 */
export const test = base.extend<PageObjects>({
  // Common Pages
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  
  // Search Pages
  dealerSearchPage: async ({ page }, use) => {
    await use(new DealerSearchPage(page));
  },
  
  appStatusPage: async ({ page }, use) => {
    await use(new AppStatusPage(page));
  },
  
  // Customer Onboarding Pages
  zipCodePage: async ({ page }, use) => {
    await use(new ZipCodePage(page));
  },
  
  mitcPage: async ({ page }, use) => {
    await use(new MitcPage(page));
  },
  
  kycPage: async ({ page }, use) => {
    await use(new KycPage(page));
  },
  
  poiPage: async ({ page }, use) => {
    await use(new PoiPage(page));
  },
  
  poaPage: async ({ page }, use) => {
    await use(new PoaPage(page));
  },

  panVerificationPage: async ({ page }, use) => {
    await use(new PanVerificationPage(page));
  },
  
  // Product Pages
  productSelectionPage: async ({ page }, use) => {
    await use(new ProductSelectionPage(page));
  },
  
  incomeDeclarationPage: async ({ page }, use) => {
    await use(new IncomeDeclarationPage(page));
  },
  
  // Approval Pages
  surrogateDetailsPage: async ({ page }, use) => {
    await use(new SurrogateDetailsPage(page));
  },
  approvalDetailsPage: async ({ page }, use) => {
    await use(new ApprovalDetailsPage(page));
  },
  additionalDetailsPage: async ({ page }, use) => {
    await use(new AdditionalDetailsPage(page));
  },
  reappraisalPage: async ({ page }, use) => {
    await use(new ReappraisalPage(page));
  },
  
  assetCartPage: async ({ page }, use) => {
    await use(new AssetCartPage(page));
  },
  
  // Admin Pages
  adminCustomerPage: async ({ page }, use) => {
    await use(new AdminCustomerPage(page));
  },
});

export { expect } from '@playwright/test';
