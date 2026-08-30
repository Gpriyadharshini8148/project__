import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * Login Page Object
 * Handles FOS and Admin login/logout operations
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
 * Login to FOS Salesforce application
 */
  async loginToFOS(
    url: string,
    username: string,
    password: string,
    loginButton: string = 'Log In'
  ): Promise<void> {
    console.log('===== FOS Login =====');
    if (!username || !password) {
      throw new Error('Login failed: Username or Password is empty. Please ensure your .env variables (FOS_USERNAME, FOS_PASSWORD) are loaded properly!');
    }
    await this.actions.goto(url, 'Navigate to FOS');
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitFor(1000);

    await this.fillTextbox('Username', username);
    await this.fillTextbox('Password', password);
    await this.clickButton(loginButton);

    console.log('Waiting for login to complete...');
    if (this.page.isClosed()) {
      console.log('Page closed during login; stopping early.');
      return;
    }

    // Handled dynamic prompts like "Remind Me Later" 
    const remindMeLater = this.page.locator("//a[text()='Remind Me Later']");
    if (await remindMeLater.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Clicking "Remind Me Later" button...');
      await remindMeLater.click();
      await this.waitFor(750);
    }

    // FIX: Changed waitUntil from 'domcontentloaded' to 'load' 
    // This forces Playwright to wait for Salesforce's frontdoor.jsp redirects to settle.
    // Ensure we match the portal URL structure but explicitly exclude the login page itself
    const portalLoaded = await this.page.waitForURL(url => {
      return url.href.includes('/dealercommunityreinvent/s/') && !url.href.includes('/login/');
    }, {
      timeout: 30000,
      waitUntil: 'load'
    }).then(() => true).catch(() => false);

    if (portalLoaded) {
      console.log('✓ Portal loaded successfully');
    } else {
      const currentUrl = this.page.url();
      console.log(`⚠ Portal did not navigate to the community dashboard route yet. Current URL: ${currentUrl}`);
      // Throw an error here so the test fails at login instead of leaking into subsequent steps
      throw new Error(`Failed to escape the login page redirect loop. Current URL: ${currentUrl}`);
    }


    console.log('Verifying portal navigation...');
    const searchTab = this.page.locator(
      "//a[contains(@class,'slds-context-bar__label-action')]//span[text()='Search'] | " +
      "//one-app-nav-bar-item-root//span[text()='Search'] | " +
      "//a[@title='Search'] | " +
      "//nav//a[contains(text(),'Search')] | " +
      "//span[text()='Search']/ancestor::a"
    ).first();

    // Give Salesforce components time to paint the DOM elements
    if (await searchTab.isVisible({ timeout: 15000 }).catch(() => false)) {
      console.log('✓ Portal navigation confirmed (Search tab visible)');
    } else {
      const currentUrl = this.page.url();
      console.log(`⚠ Search tab not immediately visible. URL: ${currentUrl}`);
      if (!currentUrl.includes('/dealercommunityreinvent/s/')) {
        throw new Error(`Portal not loaded. Current URL: ${currentUrl}`);
      }
    }

    console.log(`✓ Logged in as: ${username}`);
  }


  /**
   * Logout from FOS application
   */
  async logoutFromFOS(): Promise<void> {
    console.log('===== FOS Logout =====');
    await this.actions.click(this.page.locator('a.trigger-link'), 'Open profile menu');
    await this.actions.click(this.page.getByRole('menuitem', { name: 'Logout' }), 'Click Logout');
    await this.waitFor(5000);
    console.log('✓ Logged out from FOS');
  }

  // ==================== Admin Login/Logout ====================

  /**
   * Login to Admin Salesforce application
   */
  async loginToAdmin(
    url: string,
    username: string,
    password: string,
    loginButton: string = 'Log In'
  ): Promise<void> {
    console.log('===== Admin Login =====');
    await this.actions.goto(url, 'Navigate to Admin');
    await this.fillTextbox('Username', username);
    await this.fillTextbox('Password', password);
    await this.clickButton(loginButton);

    // Wait for page to load (similar to Java: waitForPageToLoad() + waitTime(8))
    console.log('Waiting for login to complete...');
    await this.page.waitForLoadState('domcontentloaded');
    await this.waitFor(500); // wait for MFA and page load
    console.log(`✓ Admin logged in as: ${username}`);
  }

  /**
   * Logout from Admin application
   */
  async logoutFromAdmin(): Promise<void> {
    console.log('===== Admin Logout =====');
    await this.actions.click(this.button('View profile'), 'Open profile');
    await this.actions.click(this.page.locator("//a[text()='Log Out']"), 'Click Logout');
    await this.waitFor(5000);
    console.log('✓ Logged out from Admin');
  }

  // ==================== Advanced Login Methods ====================

  /**
   * Login to FOS from Admin (impersonation)
   */
  async loginToFOSFromAdmin(
    adminUrl: string,
    usernameLabel: string,
    adminUsername: string,
    passwordLabel: string,
    adminPassword: string,
    loginButton: string,
    dealerName: string
  ): Promise<void> {
    console.log('===== Login to FOS from Admin =====');

    // Login to admin
    await this.loginToAdmin(adminUrl, adminUsername, adminPassword, loginButton);

    // Navigate to Contacts
    await this.actions.click(this.page.getByRole('link', { name: 'Contacts' }), 'Click Contacts');
    await this.waitFor(10000);

    // Switch view
    await this.actions.click(this.page.getByText('Recently Viewed'), 'Click Recently Viewed');
    await this.actions.click(this.page.getByText('All Contacts'), 'Select All Contacts');

    // Search for dealer
    await this.actions.click(this.page.getByRole('searchbox', { name: 'Search this list...' }), 'Click search');
    await this.actions.fill(
      this.page.getByRole('searchbox', { name: 'Search this list...' }),
      dealerName,
      'Enter dealer name'
    );
    await this.page.getByRole('searchbox', { name: 'Search this list...' }).press('Enter');

    // Click on dealer and login as user
    await this.actions.click(this.page.getByRole('link', { name: dealerName }), 'Click dealer');
    await this.actions.click(
      this.page.getByRole('button', { name: 'Log in to Experience as User' }),
      'Login as user'
    );
    await this.actions.click(
      this.page.getByRole('menuitemcheckbox', { name: 'Dealer Community Reinvent' }),
      'Select community'
    );
    await this.waitFor(1000);

    console.log(`✓ Logged in to FOS as: ${dealerName}`);
  }

  /**
   * Navigate to URL
   */
  async navigateToUrl(url: string): Promise<void> {
    await this.actions.goto(url, 'Navigate to URL');
    await this.waitFor(10000);
  }
}
