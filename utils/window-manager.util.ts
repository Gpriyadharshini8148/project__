import { Page, BrowserContext } from '@playwright/test';

/**
 * Window & Tab Management Utility
 * Handles multiple windows, tabs, and browser contexts
 * Inspired by Java Selenium multi-window handling patterns
 */
export class WindowManager {
  private context: BrowserContext;
  private pages: Map<string, Page>;
  private currentPageId: string;

  constructor(context: BrowserContext, initialPage: Page) {
    this.context = context;
    this.pages = new Map();
    this.currentPageId = 'main';
    this.pages.set(this.currentPageId, initialPage);
  }

  /**
   * Open new tab with URL
   */
  async openNewTab(url: string, tabId?: string): Promise<Page> {
    const newPage = await this.context.newPage();
    await newPage.goto(url);
    
    const id = tabId || `tab_${this.pages.size}`;
    this.pages.set(id, newPage);
    this.currentPageId = id;
    
    console.log(`✅ Opened new tab: ${id} → ${url}`);
    return newPage;
  }

  /**
   * Open blank new tab
   */
  async openBlankTab(tabId?: string): Promise<Page> {
    const newPage = await this.context.newPage();
    
    const id = tabId || `tab_${this.pages.size}`;
    this.pages.set(id, newPage);
    this.currentPageId = id;
    
    console.log(`✅ Opened blank tab: ${id}`);
    return newPage;
  }

  /**
   * Switch to tab by ID
   */
  switchToTab(tabId: string): Page {
    const page = this.pages.get(tabId);
    if (!page) {
      throw new Error(`Tab not found: ${tabId}`);
    }
    
    this.currentPageId = tabId;
    console.log(`🔄 Switched to tab: ${tabId}`);
    return page;
  }

  /**
   * Switch to tab by index (0-based)
   */
  switchToTabByIndex(index: number): Page {
    const tabIds = Array.from(this.pages.keys());
    if (index < 0 || index >= tabIds.length) {
      throw new Error(`Invalid tab index: ${index}`);
    }
    
    return this.switchToTab(tabIds[index]);
  }

  /**
   * Switch to tab by URL pattern
   */
  async switchToTabByURL(urlPattern: string | RegExp): Promise<Page> {
    for (const [id, page] of this.pages.entries()) {
      const url = page.url();
      const matches = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      
      if (matches) {
        return this.switchToTab(id);
      }
    }
    
    throw new Error(`No tab found matching URL pattern: ${urlPattern}`);
  }

  /**
   * Switch to tab by title
   */
  async switchToTabByTitle(titlePattern: string | RegExp): Promise<Page> {
    for (const [id, page] of this.pages.entries()) {
      const title = await page.title();
      const matches = typeof titlePattern === 'string'
        ? title.includes(titlePattern)
        : titlePattern.test(title);
      
      if (matches) {
        return this.switchToTab(id);
      }
    }
    
    throw new Error(`No tab found matching title pattern: ${titlePattern}`);
  }

  /**
   * Get current active page
   */
  getCurrentPage(): Page {
    const page = this.pages.get(this.currentPageId);
    if (!page) {
      throw new Error(`Current page not found: ${this.currentPageId}`);
    }
    return page;
  }

  /**
   * Get page by ID
   */
  getPage(tabId: string): Page | undefined {
    return this.pages.get(tabId);
  }

  /**
   * Get all open pages
   */
  getAllPages(): Page[] {
    return Array.from(this.pages.values());
  }

  /**
   * Get tab count
   */
  getTabCount(): number {
    return this.pages.size;
  }

  /**
   * Get all tab IDs
   */
  getTabIds(): string[] {
    return Array.from(this.pages.keys());
  }

  /**
   * Close tab by ID
   */
  async closeTab(tabId: string, switchTo?: string): Promise<void> {
    const page = this.pages.get(tabId);
    if (!page) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    await page.close();
    this.pages.delete(tabId);
    
    // Switch to specified tab or first available tab
    if (this.currentPageId === tabId) {
      if (switchTo && this.pages.has(switchTo)) {
        this.currentPageId = switchTo;
      } else if (this.pages.size > 0) {
        this.currentPageId = Array.from(this.pages.keys())[0];
      }
    }
    
    console.log(`❌ Closed tab: ${tabId}`);
  }

  /**
   * Close all tabs except specified
   */
  async closeAllExcept(keepTabId: string): Promise<void> {
    const tabsToClose = Array.from(this.pages.keys()).filter(id => id !== keepTabId);
    
    for (const tabId of tabsToClose) {
      await this.closeTab(tabId);
    }
    
    this.currentPageId = keepTabId;
    console.log(`🧹 Closed all tabs except: ${keepTabId}`);
  }

  /**
   * Close all tabs except current
   */
  async closeAllExceptCurrent(): Promise<void> {
    await this.closeAllExcept(this.currentPageId);
  }

  /**
   * Close all tabs
   */
  async closeAllTabs(): Promise<void> {
    for (const page of this.pages.values()) {
      await page.close();
    }
    this.pages.clear();
    console.log(`🧹 Closed all tabs`);
  }

  /**
   * Wait for new tab to open (with timeout)
   */
  async waitForNewTab(
    timeout: number = 10000,
    tabId?: string
  ): Promise<Page> {
    const initialCount = this.pages.size;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for new tab (${timeout}ms)`));
      }, timeout);

      this.context.on('page', (page) => {
        const id = tabId || `tab_${this.pages.size}`;
        this.pages.set(id, page);
        this.currentPageId = id;
        
        clearTimeout(timeoutId);
        console.log(`✅ New tab detected: ${id}`);
        resolve(page);
      });
    });
  }

  /**
   * Handle popup window (wait for popup and switch to it)
   */
  async handlePopup(
    triggerAction: () => Promise<void>,
    tabId?: string,
    timeout: number = 10000
  ): Promise<Page> {
    const popupPromise = this.context.waitForEvent('page', { timeout });
    
    await triggerAction();
    
    const popup = await popupPromise;
    const id = tabId || `popup_${this.pages.size}`;
    this.pages.set(id, popup);
    this.currentPageId = id;
    
    console.log(`✅ Popup window opened: ${id}`);
    return popup;
  }

  /**
   * Get tab info (title, URL)
   */
  async getTabInfo(tabId?: string): Promise<{ id: string; title: string; url: string }> {
    const id = tabId || this.currentPageId;
    const page = this.pages.get(id);
    
    if (!page) {
      throw new Error(`Tab not found: ${id}`);
    }

    const title = await page.title();
    const url = page.url();

    return { id, title, url };
  }

  /**
   * Get all tabs info
   */
  async getAllTabsInfo(): Promise<Array<{ id: string; title: string; url: string }>> {
    const infos = [];
    
    for (const [id, page] of this.pages.entries()) {
      const title = await page.title();
      const url = page.url();
      infos.push({ id, title, url });
    }
    
    return infos;
  }

  /**
   * Print all tabs info (for debugging)
   */
  async printAllTabs(): Promise<void> {
    console.log('\n📑 Open Tabs:');
    console.log('═'.repeat(80));
    
    const infos = await this.getAllTabsInfo();
    infos.forEach((info, index) => {
      const isCurrent = info.id === this.currentPageId ? ' ← CURRENT' : '';
      console.log(`[${index}] ${info.id}${isCurrent}`);
      console.log(`    Title: ${info.title}`);
      console.log(`    URL: ${info.url}`);
      console.log('─'.repeat(80));
    });
  }

  /**
   * Execute action in specific tab and return to current
   */
  async executeInTab<T>(
    tabId: string,
    action: (page: Page) => Promise<T>
  ): Promise<T> {
    const originalTabId = this.currentPageId;
    const targetPage = this.switchToTab(tabId);
    
    try {
      const result = await action(targetPage);
      return result;
    } finally {
      this.switchToTab(originalTabId);
    }
  }

  /**
   * Bring tab to front (focus)
   */
  async bringToFront(tabId?: string): Promise<void> {
    const id = tabId || this.currentPageId;
    const page = this.pages.get(id);
    
    if (!page) {
      throw new Error(`Tab not found: ${id}`);
    }

    await page.bringToFront();
    console.log(`🔼 Brought tab to front: ${id}`);
  }

  /**
   * Reload tab
   */
  async reloadTab(tabId?: string): Promise<void> {
    const id = tabId || this.currentPageId;
    const page = this.pages.get(id);
    
    if (!page) {
      throw new Error(`Tab not found: ${id}`);
    }

    await page.reload();
    console.log(`🔄 Reloaded tab: ${id}`);
  }

  /**
   * Take screenshot of specific tab
   */
  async screenshotTab(tabId: string, path: string): Promise<void> {
    const page = this.pages.get(tabId);
    
    if (!page) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    await page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot saved: ${path}`);
  }

  /**
   * Navigate tab to URL
   */
  async navigateTab(tabId: string, url: string): Promise<void> {
    const page = this.pages.get(tabId);
    
    if (!page) {
      throw new Error(`Tab not found: ${tabId}`);
    }

    await page.goto(url);
    console.log(`🔗 Navigated ${tabId} to: ${url}`);
  }
}
