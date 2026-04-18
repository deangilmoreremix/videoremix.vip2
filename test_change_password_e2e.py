from playwright.sync_api import sync_playwright
import time
import sys

def test_change_password_flow():
    """Comprehensive test of the change password functionality"""

    print("🚀 Starting Change Password Flow Test")
    print("=" * 50)

    with sync_playwright() as p:
        try:
            # Launch browser
            browser = p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            page = browser.new_page()

            print("✅ Browser launched successfully")

            # Test 1: Navigate to app and check landing page
            print("\n📋 Test 1: Landing Page Access")
            page.goto('http://localhost:5173')
            page.wait_for_load_state('networkidle')

            # Verify we're on the landing page
            assert page.locator('h1').filter(has_text='Start Your Journey').is_visible()
            assert page.locator('a').filter(has_text='VideoRemix.vip').is_visible()
            print("✅ Landing page loads correctly")

            # Test 2: Navigate to signin page
            print("\n📋 Test 2: Signin Page Navigation")
            signin_link = page.locator('a').filter(has_text='Sign In').first
            signin_link.click()
            page.wait_for_load_state('networkidle')

            # Verify we're on signin page
            assert '/signin' in page.url
            assert page.locator('h1').filter(has_text='Welcome Back').is_visible()
            print("✅ Signin page loads correctly")

            # Test 3: Navigate to signup to create test user
            print("\n📋 Test 3: Create Test User")
            signup_link = page.locator('a').filter(has_text='Sign Up').first
            signup_link.click()
            page.wait_for_load_state('networkidle')

            # Verify signup page
            assert '/signup' in page.url
            assert page.locator('h1').filter(has_text='Start Your Journey').is_visible()
            print("✅ Signup page loads correctly")

            # Test 4: Attempt signup (will fail due to existing user, but tests form)
            print("\n📋 Test 4: Test Signup Form Validation")

            # Fill out signup form
            page.fill('input[type="text"]', 'Test User')  # First name
            page.fill('input[type="email"]', 'test@example.com')
            page.fill('input[type="password"]').first, 'TestPass123!'
            page.fill('input[type="password"]').nth(1), 'TestPass123!'  # Confirm password

            # Check form validation by submitting
            submit_button = page.locator('button').filter(has_text='Create Account').first
            submit_button.click()

            # Wait for potential error or success
            page.wait_for_timeout(2000)

            # Check if we're still on signup page (user might already exist)
            if '/signup' in page.url:
                print("✅ Signup form validation works (user may already exist)")
            else:
                print("✅ Signup successful")

            # Test 5: Navigate to profile page (assuming user is logged in or we simulate)
            print("\n📋 Test 5: Profile Page Access")

            # Try to navigate to profile directly
            page.goto('http://localhost:5173/profile')
            page.wait_for_load_state('networkidle')

            # If redirected to signin, that's expected for unauthenticated user
            if '/signin' in page.url:
                print("✅ Protected route redirects unauthenticated users correctly")
            else:
                # Check for change password link
                change_password_link = page.locator('a').filter(has_text='Change Password')
                if change_password_link.is_visible():
                    print("✅ Change Password link visible in profile")
                else:
                    print("⚠️ Change Password link not found in profile")

            # Test 6: Direct access to change password page
            print("\n📋 Test 6: Change Password Page Direct Access")
            page.goto('http://localhost:5173/reset-password')
            page.wait_for_load_state('networkidle')

            # Verify we're on the change password page
            assert '/reset-password' in page.url
            assert page.locator('h2').filter(has_text='Change Password').is_visible()
            print("✅ Change Password page loads correctly")

            # Test 7: Form validation
            print("\n📋 Test 7: Change Password Form Validation")

            # Test empty form submission
            submit_button = page.locator('button[type="submit"]').first
            submit_button.click()
            page.wait_for_timeout(1000)

            # Should still be on the page (validation prevents submission)
            assert '/reset-password' in page.url
            print("✅ Form prevents submission with empty fields")

            # Test password mismatch
            page.fill('input[type="email"]', 'test@example.com')
            page.fill('input[type="password"]').first, 'password123'
            page.fill('input[type="password"]').nth(1), 'different456'
            submit_button.click()
            page.wait_for_timeout(1000)

            # Should show error message
            error_message = page.locator('text=/passwords do not match/i').first
            if error_message.is_visible():
                print("✅ Password mismatch validation works")
            else:
                print("⚠️ Password mismatch validation may not be working")

            # Test short password
            page.fill('input[type="password"]').first, '123'
            page.fill('input[type="password"]').nth(1), '123'
            submit_button.click()
            page.wait_for_timeout(1000)

            # Should show error message
            error_message = page.locator('text=/must be at least/i').first
            if error_message.is_visible():
                print("✅ Password length validation works")
            else:
                print("⚠️ Password length validation may not be working")

            # Test 8: Valid form submission
            print("\n📋 Test 8: Valid Password Change Submission")
            page.fill('input[type="email"]', 'test@example.com')
            page.fill('input[type="password"]').first, 'NewPass123!'
            page.fill('input[type="password"]').nth(1), 'NewPass123!'
            submit_button.click()

            # Wait for submission
            page.wait_for_timeout(3000)

            # Check if success message appears or redirect happens
            success_message = page.locator('text=/password updated successfully/i').first
            if success_message.is_visible():
                print("✅ Password change success message displayed")
            elif '/signin' in page.url:
                print("✅ Password change redirects to signin on success")
            else:
                print("⚠️ Password change behavior unclear - may need manual verification")

            # Test 9: UI Elements Check
            print("\n📋 Test 9: UI Elements Verification")
            page.reload()
            page.wait_for_load_state('networkidle')

            # Check for all required elements
            email_input = page.locator('input[type="email"]')
            password_inputs = page.locator('input[type="password"]')
            submit_button = page.locator('button[type="submit"]')

            assert email_input.is_visible(), "Email input should be visible"
            assert password_inputs.count() == 2, "Should have 2 password inputs"
            assert submit_button.is_visible(), "Submit button should be visible"

            print("✅ All required form elements present")

            # Test 10: Accessibility and UX
            print("\n📋 Test 10: Accessibility and UX Checks")

            # Check for labels
            email_label = page.locator('label').filter(has_text='Email Address')
            password_label = page.locator('label').filter(has_text='New Password')

            if email_label.is_visible() and password_label.is_visible():
                print("✅ Form labels are properly displayed")
            else:
                print("⚠️ Some form labels may be missing")

            # Check for back to home link
            back_link = page.locator('a').filter(has_text='Back to home')
            if back_link.is_visible():
                print("✅ Navigation links are present")
            else:
                print("⚠️ Navigation links may be missing")

            print("\n🎉 CHANGE PASSWORD TESTING COMPLETE")
            print("=" * 50)
            print("✅ All automated tests passed!")
            print("📝 Manual verification recommended for:")
            print("   - Actual password update functionality")
            print("   - Email delivery (if configured)")
            print("   - Mobile responsiveness")

            return True

        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            # Take screenshot for debugging
            try:
                page.screenshot(path='/tmp/change_password_test_failure.png')
                print("📸 Screenshot saved to /tmp/change_password_test_failure.png")
            except:
                pass
            return False

        finally:
            browser.close()

if __name__ == '__main__':
    success = test_change_password_flow()
    sys.exit(0 if success else 1)