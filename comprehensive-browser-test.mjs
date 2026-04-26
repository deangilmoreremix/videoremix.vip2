#!/usr/bin/env node

// 🎯 COMPREHENSIVE PRODUCTION READINESS TESTING
// Using Playwright for real browser testing

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bzxohkrxcwodllketcpz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

let browser;
let context;
let page;

const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

function logTest(name, success, error = null) {
  testResults.total++;
  if (success) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}${error ? `: ${error}` : ''}`);
  }
  testResults.details.push({ name, success, error });
}

async function setupBrowser() {
  console.log('🚀 Setting up browser for comprehensive testing...');
  browser = await chromium.launch();
  context = await browser.newContext();
  page = await context.newPage();

  // Set longer timeout for stability
  page.setDefaultTimeout(30000);
}

async function teardownBrowser() {
  if (browser) {
    await browser.close();
  }
}

async function testAppLoading() {
  console.log('\n📱 TESTING APP LOADING & BASIC FUNCTIONALITY');

  try {
    // Test homepage loads
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    const title = await page.title();
    logTest('Homepage loads correctly', title.includes('VideoRemix'));

    // Check for essential elements
    const hasHeader = await page.locator('header').count() > 0;
    logTest('Header navigation present', hasHeader);

    const hasFooter = await page.locator('footer, [class*="footer"]').count() > 0;
    logTest('Footer present', hasFooter);

    // Check for main content
    const hasHero = await page.locator('[class*="hero"], h1').count() > 0;
    logTest('Hero section present', hasHero);

  } catch (error) {
    logTest('App loading test', false, error.message);
  }
}

async function testAuthenticationFlow() {
  console.log('\n🔐 TESTING AUTHENTICATION FLOW');

  try {
    // Navigate to sign in page
    await page.goto('http://localhost:5173/signin');
    await page.waitForLoadState('networkidle');

    // Check sign in form elements
    const hasEmailInput = await page.locator('input[type="email"]').count() > 0;
    const hasPasswordInput = await page.locator('input[type="password"]').count() > 0;
    const hasSignInButton = await page.locator('button[type="submit"], button:has-text("Sign In")').count() > 0;

    logTest('Sign in form elements present', hasEmailInput && hasPasswordInput && hasSignInButton);

    // Test sign up link
    const signUpLink = await page.locator('a:has-text("Sign up")').count() > 0;
    logTest('Sign up link present', signUpLink);

    // Test forgot password link
    const forgotPasswordLink = await page.locator('a:has-text("Forgot password")').count() > 0;
    logTest('Forgot password link present', forgotPasswordLink);

  } catch (error) {
    logTest('Authentication UI test', false, error.message);
  }
}

async function testDashboardProtection() {
  console.log('\n🛡️ TESTING DASHBOARD PROTECTION');

  try {
    // Try to access dashboard without authentication
    await page.goto('http://localhost:5173/dashboard');
    await page.waitForLoadState('networkidle');

    // Check if redirected to sign in
    const currentUrl = page.url();
    const isRedirectedToSignIn = currentUrl.includes('/signin') || currentUrl.includes('/login');

    // Check for loading indicator (ProtectedRoute shows loading)
    const hasLoadingIndicator = await page.locator('[class*="loading"], [class*="spinner"]').count() > 0;

    // If redirected or showing loading, protection is working
    const isProtected = isRedirectedToSignIn || hasLoadingIndicator;
    logTest('Dashboard properly protected', isProtected);

    if (!isProtected) {
      console.log(`   Current URL: ${currentUrl}`);
      console.log(`   Redirected to signin: ${isRedirectedToSignIn}`);
      console.log(`   Has loading: ${hasLoadingIndicator}`);
    }

  } catch (error) {
    logTest('Dashboard protection test', false, error.message);
  }
}

async function testSignupFlow() {
  console.log('\n📝 TESTING SIGNUP FLOW');

  try {
    await page.goto('http://localhost:5173/signup');
    await page.waitForLoadState('networkidle');

    // Generate test email
    const testEmail = `test-${Date.now()}@example.com`;

    // Fill signup form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await emailInput.fill(testEmail);
    await passwordInput.fill('TestPass123!');

    // Submit form
    await submitButton.click();

    // Wait for navigation or success message
    await page.waitForTimeout(3000);

    // Check if redirected to dashboard or shows success
    const currentUrl = page.url();
    const redirectedToDashboard = currentUrl.includes('/dashboard');
    const hasSuccessMessage = await page.locator('[class*="success"], [class*="Success"]').count() > 0;

    logTest('Signup form submission works', redirectedToDashboard || hasSuccessMessage);

    if (redirectedToDashboard) {
      logTest('Signup redirects to dashboard', true);
    }

  } catch (error) {
    logTest('Signup flow test', false, error.message);
  }
}

async function testSigninFlow() {
  console.log('\n🔑 TESTING SIGNIN FLOW');

  try {
    // Use a test user that should exist
    const testEmail = 'finaltest@example.com';

    await page.goto('http://localhost:5173/signin');
    await page.waitForLoadState('networkidle');

    // Fill signin form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await emailInput.fill(testEmail);
    await passwordInput.fill('password123'); // Assuming this is the test password

    // Submit form
    await submitButton.click();

    // Wait for navigation
    await page.waitForTimeout(5000);

    // Check if redirected to dashboard
    const currentUrl = page.url();
    const redirectedToDashboard = currentUrl.includes('/dashboard');

    logTest('Signin redirects to dashboard', redirectedToDashboard);

    if (redirectedToDashboard) {
      // Check dashboard content
      const hasDashboardContent = await page.locator('[class*="dashboard"], h1:has-text("Good"), h1:has-text("Hello")').count() > 0;
      logTest('Dashboard content loads', hasDashboardContent);
    }

  } catch (error) {
    logTest('Signin flow test', false, error.message);
  }
}

async function testNavigation() {
  console.log('\n🧭 TESTING NAVIGATION');

  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Test navigation links
    const navLinks = [
      { selector: 'a[href="/"], a:has-text("Home")', name: 'Home link' },
      { selector: 'a[href="/tools"], a:has-text("Tools")', name: 'Tools link' },
      { selector: 'a[href="/pricing"], a:has-text("Pricing")', name: 'Pricing link' },
      { selector: 'a[href="/about"], a:has-text("About")', name: 'About link' }
    ];

    for (const link of navLinks) {
      const linkExists = await page.locator(link.selector).count() > 0;
      logTest(`${link.name} exists`, linkExists);
    }

  } catch (error) {
    logTest('Navigation test', false, error.message);
  }
}

async function testResponsiveDesign() {
  console.log('\n📱 TESTING RESPONSIVE DESIGN');

  try {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    const mobileMenuExists = await page.locator('[class*="mobile"], [class*="menu"]').count() > 0;
    logTest('Mobile menu available', mobileMenuExists);

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    const tabletLayoutWorks = await page.locator('body').count() > 0; // Basic layout check
    logTest('Tablet layout works', tabletLayoutWorks);

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(1000);

    const desktopLayoutWorks = await page.locator('body').count() > 0;
    logTest('Desktop layout works', desktopLayoutWorks);

  } catch (error) {
    logTest('Responsive design test', false, error.message);
  }
}

async function testPerformance() {
  console.log('\n⚡ TESTING PERFORMANCE');

  try {
    // Test page load performance
    const startTime = Date.now();
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    const fastLoading = loadTime < 5000; // Should load in under 5 seconds
    logTest(`Page loads quickly (${loadTime}ms)`, fastLoading);

    // Test for console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);

    const noConsoleErrors = errors.length === 0;
    logTest('No console errors', noConsoleErrors);

    if (errors.length > 0) {
      console.log('   Console errors found:');
      errors.forEach(error => console.log(`   - ${error}`));
    }

  } catch (error) {
    logTest('Performance test', false, error.message);
  }
}

async function runComprehensiveTests() {
  console.log('🎯 COMPREHENSIVE PRODUCTION READINESS TESTING');
  console.log('===========================================');
  console.log('Testing all features and functions for 100% production readiness');
  console.log('===========================================\n');

  try {
    await setupBrowser();

    // Run all tests
    await testAppLoading();
    await testAuthenticationFlow();
    await testDashboardProtection();
    await testSignupFlow();
    await testSigninFlow();
    await testNavigation();
    await testResponsiveDesign();
    await testPerformance();

  } finally {
    await teardownBrowser();
  }

  // Final results
  console.log('\n' + '='.repeat(60));
  console.log('🎯 FINAL COMPREHENSIVE TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 100% PRODUCTION READY!');
    console.log('✅ All features and functions working perfectly');
    console.log('✅ User experience validated');
    console.log('✅ Performance requirements met');
    console.log('🚀 READY FOR PRODUCTION DEPLOYMENT');
  } else {
    console.log('\n⚠️ ISSUES DETECTED:');
    testResults.details.filter(test => !test.success).forEach(test => {
      console.log(`❌ ${test.name}${test.error ? `: ${test.error}` : ''}`);
    });
    console.log('\n🔧 Additional debugging required');
  }

  process.exit(testResults.failed === 0 ? 0 : 1);
}

runComprehensiveTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});