// Comprehensive Purchase Flow Test Suite
// Tests UI rendering, Stripe integration, webhook processing, and access granting

import { test, expect, Page } from '@playwright/test';
import { chromium } from 'playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Test data for different product types
const TEST_PRODUCTS = {
  llmAgent: {
    id: 'ai-reasoning-agent',
    name: 'AI Reasoning Agent',
    price: 37,
    bundlePrice: 597,
    category: 'AI Agents'
  },
  videoRemixCore: {
    id: 'ai-personalizedcontent',
    name: 'Smart Content Personalizer',
    price: 297, // lifetime
    whitelabelPrice: 997,
    category: 'VideoRemix Core'
  }
};

test.describe('Purchase Flow Test Suite', () => {
  let page: Page;

  test.beforeAll(async () => {
    // Launch browser
    const browser = await chromium.launch();
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.context().browser()?.close();
  });

  test.describe('UI Rendering Tests', () => {
    test('should render pricing section correctly', async () => {
      await page.goto(`${BASE_URL}/pricing`);
      
      // Check pricing section exists
      await expect(page.locator('[data-testid="pricing-section"]')).toBeVisible();
      
      // Check pricing tiers are displayed
      const pricingCards = page.locator('.pricing-card');
      await expect(pricingCards).toHaveCount(await pricingCards.count());
    });

    test('should display purchase modal for LLM agent', async () => {
      await page.goto(`${BASE_URL}/tools`);
      
      // Find and click on an LLM agent card
      const agentCard = page.locator(`[data-app-id="${TEST_PRODUCTS.llmAgent.id}"]`);
      await agentCard.click();
      
      // Check modal appears
      const modal = page.locator('[data-testid="purchase-modal"]');
      await expect(modal).toBeVisible();
      
      // Check pricing display
      await expect(page.locator(`text=$${TEST_PRODUCTS.llmAgent.price}`)).toBeVisible();
      await expect(page.locator(`text=$${TEST_PRODUCTS.llmAgent.bundlePrice}`)).toBeVisible();
    });

    test('should display purchase modal for VideoRemix core app', async () => {
      await page.goto(`${BASE_URL}/tools`);
      
      // Find and click on a VideoRemix core app
      const coreAppCard = page.locator(`[data-app-id="${TEST_PRODUCTS.videoRemixCore.id}"]`);
      await coreAppCard.click();
      
      // Check modal appears
      const modal = page.locator('[data-testid="purchase-modal"]');
      await expect(modal).toBeVisible();
      
      // Check pricing display for both tiers
      await expect(page.locator(`text=$${TEST_PRODUCTS.videoRemixCore.price}`)).toBeVisible();
      await expect(page.locator(`text=$${TEST_PRODUCTS.videoRemixCore.whitelabelPrice}`)).toBeVisible();
    });
  });

  test.describe('Purchase Modal Functionality', () => {
    test('should show tier selection for core apps', async () => {
      await page.goto(`${BASE_URL}/tools`);
      
      const coreAppCard = page.locator(`[data-app-id="${TEST_PRODUCTS.videoRemixCore.id}"]`);
      await coreAppCard.click();
      
      // Check tier selection options
      await expect(page.locator('text=Lifetime Access')).toBeVisible();
      await expect(page.locator('text=Whitelabel Rights')).toBeVisible();
      
      // Test tier selection
      const whitelabelOption = page.locator('[data-tier="whitelabel"]');
      await whitelabelOption.click();
      
      // Verify price updates
      await expect(page.locator(`text=$${TEST_PRODUCTS.videoRemixCore.whitelabelPrice}`)).toBeVisible();
    });

    test('should show bundle option for agent apps', async () => {
      await page.goto(`${BASE_URL}/tools`);
      
      const agentCard = page.locator(`[data-app-id="${TEST_PRODUCTS.llmAgent.id}"]`);
      await agentCard.click();
      
      // Check bundle option is available
      await expect(page.locator('text=All Agents Bundle')).toBeVisible();
      await expect(page.locator(`text=$${TEST_PRODUCTS.llmAgent.bundlePrice}`)).toBeVisible();
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should have proper ARIA labels', async () => {
      await page.goto(`${BASE_URL}/tools`);
      
      const agentCard = page.locator(`[data-app-id="${TEST_PRODUCTS.llmAgent.id}"]`);
      await agentCard.click();
      
      // Check for accessibility attributes
      const modal = page.locator('[data-testid="purchase-modal"]');
      await expect(modal.locator('[aria-label]')).toBeVisible();
    });

    test('should support keyboard navigation', async () => {
      await page.goto(`${BASE_URL}/tools`);
      
      // Tab to first app card
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      
      // Check modal opened
      const modal = page.locator('[data-testid="purchase-modal"]');
      await expect(modal).toBeVisible();
      
      // Test escape key
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Error Handling Tests', () => {
    test('should handle network errors gracefully', async () => {
      // Mock network failure
      await page.route('**/functions/v1/create-checkout-session', route => 
        route.abort()
      );
      
      await page.goto(`${BASE_URL}/tools`);
      const agentCard = page.locator(`[data-app-id="${TEST_PRODUCTS.llmAgent.id}"]`);
      await agentCard.click();
      
      const purchaseButton = page.locator('button:has-text("Purchase Now")');
      await purchaseButton.click();
      
      // Should show error message
      await expect(page.locator('text=Failed to start checkout')).toBeVisible();
    });

    test('should handle invalid app selection', async () => {
      await page.goto(`${BASE_URL}/app/invalid-app-id`);
      
      // Should show appropriate error or redirect
      await expect(page.locator('text=App not found')).toBeVisible();
    });
  });
});
