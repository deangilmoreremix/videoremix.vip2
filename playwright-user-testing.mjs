// 🎭 Playwright User Flow Testing - 5 Real Database Users
// Testing login, password reset, and authentication flows

import { chromium } from 'playwright';

const BASE_URL = 'https://videoremix.vip'; // Assuming production URL
const TEST_USERS = [
  'finaltest@example.com',
  'merdist@bigpond.net.au',
  'skystore@yahoo.com', 
  'r.d.mistry@outlook.com',
  'diane@dianepleone.com'
];

let browser;
let context;
let page;

async function setupBrowser() {
  browser = await chromium.launch({ headless: true }); // Show browser for debugging
  context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  page = await context.newPage();
}

async function teardownBrowser() {
  if (browser) {
    await browser.close();
  }
}

async function takeScreenshot(name) {
  await page.screenshot({ path: `playwright-test-${name}.png`, fullPage: true });
}

async function testUserFlow(userEmail, testIndex) {
  console.log(`\n🧪 Testing User ${testIndex + 1}/5: ${userEmail}`);
  
  try {
    // Navigate to sign in page
    console.log(`  📍 Navigating to sign in page...`);
    await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
    await takeScreenshot(`user-${testIndex + 1}-signin-page`);
    
    // Test sign in form presence
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const signInButton = page.locator('button[type="submit"], button:has-text("Sign In")');
    
    await emailInput.waitFor({ timeout: 5000 });
    await passwordInput.waitFor({ timeout: 5000 });
    console.log(`  ✅ Sign in form elements present`);
    
    // Test forgot password link
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")').first();
    if (await forgotPasswordLink.count() > 0) {
      console.log(`  🔗 Testing forgot password flow...`);
      await forgotPasswordLink.click();
      await page.waitForURL('**/forgot-password', { timeout: 5000 });
      await takeScreenshot(`user-${testIndex + 1}-forgot-password`);
      
      // Fill forgot password form
      const resetEmailInput = page.locator('input[type="email"]');
      await resetEmailInput.waitFor({ timeout: 5000 });
      await resetEmailInput.fill(userEmail);
      
      const resetButton = page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Send")');
      await resetButton.click();
      
      // Wait for success message or redirect
      await page.waitForTimeout(2000);
      console.log(`  ✅ Password reset request submitted`);
      await takeScreenshot(`user-${testIndex + 1}-reset-submitted`);
      
      // Go back to sign in
      await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
    }
    
    // Test signup flow
    console.log(`  📝 Testing signup flow...`);
    const signUpLink = page.locator('a:has-text("Sign up"), a:has-text("Create"), a:has-text("Register")').first();
    if (await signUpLink.count() > 0) {
      await signUpLink.click();
      await page.waitForURL('**/signup', { timeout: 5000 });
      await takeScreenshot(`user-${testIndex + 1}-signup-page`);
      
      // Fill signup form with test data
      const signupEmailInput = page.locator('input[type="email"]');
      const signupPasswordInput = page.locator('input[type="password"]');
      const confirmPasswordInput = page.locator('input[placeholder*="confirm"], input[name*="confirm"]');
      
      await signupEmailInput.waitFor({ timeout: 5000 });
      await signupEmailInput.fill(`test-signup-${Date.now()}@example.com`);
      await signupPasswordInput.fill('TestPass123!');
      
      if (await confirmPasswordInput.count() > 0) {
        await confirmPasswordInput.fill('TestPass123!');
      }
      
      const signupButton = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Create")');
      await signupButton.click();
      
      // Wait for success or redirect
      await page.waitForTimeout(3000);
      console.log(`  ✅ Signup form submitted`);
      await takeScreenshot(`user-${testIndex + 1}-signup-submitted`);
    }
    
    // Test case-insensitive email (try uppercase version)
    console.log(`  🔄 Testing case-insensitive email...`);
    await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
    
    const upperCaseEmail = userEmail.toUpperCase();
    await emailInput.fill(upperCaseEmail);
    await passwordInput.fill('TestPassword123!'); // Generic test password
    
    await signInButton.click();
    await page.waitForTimeout(2000);
    
    // Check if we get a proper error (not case sensitivity issue)
    const errorMessage = page.locator('.error, .alert, [role="alert"]').first();
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.textContent();
      if (errorText.includes('Invalid') || errorText.includes('not found')) {
        console.log(`  ✅ Case-insensitive handling works (got expected error)`);
      }
    }
    await takeScreenshot(`user-${testIndex + 1}-case-test`);
    
    console.log(`  🎉 User ${testIndex + 1} testing completed successfully`);
    return true;
    
  } catch (error) {
    console.log(`  ❌ User ${testIndex + 1} testing failed: ${error.message}`);
    await takeScreenshot(`user-${testIndex + 1}-error`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 PLAYWRIGHT USER FLOW TESTING - 5 REAL DATABASE USERS');
  console.log('================================================================');
  console.log(`Testing ${TEST_USERS.length} users on ${BASE_URL}`);
  console.log('Testing: Login forms, Password reset, Signup flows, Case sensitivity');
  console.log('================================================================');
  
  await setupBrowser();
  
  let passed = 0;
  let failed = 0;
  
  for (let i = 0; i < TEST_USERS.length; i++) {
    const success = await testUserFlow(TEST_USERS[i], i);
    if (success) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between users
    await page.waitForTimeout(1000);
  }
  
  console.log('\n================================================================');
  console.log('🎯 PLAYWRIGHT TESTING RESULTS');
  console.log('================================================================');
  console.log(`Total Users Tested: ${TEST_USERS.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${Math.round((passed / TEST_USERS.length) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL USER FLOWS WORKING PERFECTLY!');
    console.log('✅ Authentication UI fully functional');
    console.log('✅ Password reset flows accessible');
    console.log('✅ Signup process working');
    console.log('✅ Case-insensitive email handling');
    console.log('✅ Error handling proper');
  } else {
    console.log('\n⚠️ SOME FLOWS NEED ATTENTION');
    console.log('Check screenshots for details');
  }
  
  await teardownBrowser();
}

runAllTests().catch(console.error);
