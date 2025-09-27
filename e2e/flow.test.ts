import { test, expect } from '@playwright/test';
import { encryptedStorage } from '../services/encryptedStorage';
import { sealEncryption } from '../services/sealEncryption';
import { walrusClient } from '../services/walrusClient';
import { accessControl } from '../services/accessControl';

test.describe('Decentralized Canvas E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Connect wallet (mock)
    await page.click('text=Connect Wallet');
    await page.waitForSelector('text=Connected');
  });

  test('complete design flow with encryption and versioning', async ({ page }) => {
    // Create new design
    await page.click('button:has-text("New Design")');
    
    // Add some elements
    await page.click('button:has-text("Rectangle")');
    await page.mouse.click(100, 100);
    await page.mouse.click(200, 200);

    await page.click('button:has-text("Circle")');
    await page.mouse.click(300, 300);
    await page.mouse.click(350, 350);

    await page.click('button:has-text("Text")');
    await page.type('.canvas-text-input', 'Hello World');
    
    // Save design
    await page.click('button:has-text("Save")');
    await page.fill('input[placeholder="Design Name"]', 'Test Design');
    await page.click('button:has-text("Save Design")');
    
    // Wait for save confirmation
    await page.waitForSelector('text=Design saved successfully');
    
    // Verify encryption
    const designs = await page.evaluate(() => {
      return window.localStorage.getItem('designs');
    });
    expect(designs).toBeTruthy();
    
    // Make changes
    await page.click('button:has-text("Rectangle")');
    await page.mouse.click(400, 400);
    await page.mouse.click(500, 500);
    
    // Save new version
    await page.click('button:has-text("Save")');
    await page.click('button:has-text("Save Design")');
    
    // Check version history
    await page.click('button:has-text("Version History")');
    await expect(page.locator('.version-item')).toHaveCount(2);
    
    // Try rollback
    await page.click('.version-item >> nth=0');
    await page.click('button:has-text("Rollback")');
    
    // Verify canvas state
    const objectCount = await page.evaluate(() => {
      return document.querySelectorAll('.canvas-object').length;
    });
    expect(objectCount).toBe(3); // Original 3 objects
    
    // Test sharing
    await page.click('button:has-text("Share")');
    await page.fill('input[placeholder="Recipient Address"]', '0x5678');
    await page.selectOption('select[name="permission"]', 'read');
    await page.click('button:has-text("Add")');
    
    // Verify access control
    await page.click('button:has-text("Access Control")');
    const readers = await page.locator('.reader-list .address').allTextContents();
    expect(readers).toContain('0x5678');
    
    // Test publish
    await page.click('button:has-text("Publish")');
    await page.click('button:has-text("Confirm Publish")');
    
    // Verify public access
    const publicUrl = await page.locator('.public-url').textContent();
    expect(publicUrl).toContain('walrus.blob');
  });

  test('collaborative editing with permissions', async ({ page, browser }) => {
    // First user creates design
    await page.click('button:has-text("New Design")');
    await page.click('button:has-text("Rectangle")');
    await page.mouse.click(100, 100);
    await page.mouse.click(200, 200);
    
    await page.click('button:has-text("Save")');
    await page.fill('input[placeholder="Design Name"]', 'Collaborative Test');
    await page.click('button:has-text("Save Design")');
    
    // Share with write permissions
    await page.click('button:has-text("Share")');
    await page.fill('input[placeholder="Recipient Address"]', '0x9abc');
    await page.selectOption('select[name="permission"]', 'write');
    await page.click('button:has-text("Add")');
    
    // Second user accesses design
    const userBPage = await browser.newPage();
    await userBPage.goto('/');
    
    // Connect second wallet (mock)
    await userBPage.click('text=Connect Wallet');
    await userBPage.waitForSelector('text=Connected');
    
    // Load shared design
    await userBPage.click('text=Shared with me');
    await userBPage.click('text=Collaborative Test');
    
    // Make changes
    await userBPage.click('button:has-text("Circle")');
    await userBPage.mouse.click(300, 300);
    await userBPage.mouse.click(350, 350);
    
    await userBPage.click('button:has-text("Save")');
    await userBPage.click('button:has-text("Save Design")');
    
    // Verify version history shows both contributors
    await page.click('button:has-text("Version History")');
    const contributors = await page.locator('.version-item .author').allTextContents();
    expect(contributors).toContain('0x1234'); // First user
    expect(contributors).toContain('0x9abc'); // Second user
  });
});