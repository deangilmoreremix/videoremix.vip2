from playwright.sync_api import sync_playwright

def test_login_logout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Go to the app
            page.goto('http://localhost:5174')
            page.wait_for_load_state('networkidle')

            # Should be on landing page
            assert 'VideoRemix' in page.title()
            print("✓ Landing page loads correctly")

            # Try to access dashboard - should redirect to signin
            page.goto('http://localhost:5174/dashboard')
            page.wait_for_load_state('networkidle')

            # Should be redirected to signin
            assert '/signin' in page.url or 'sign-in' in page.url.lower()
            print("✓ Protected route redirects to signin")

            # Go to signup page
            page.goto('http://localhost:5174/signup')
            page.wait_for_load_state('networkidle')

            # Fill signup form
            page.fill('input[type="email"]', 'test@example.com')
            page.fill('input[type="password"]', 'TestPass123!')
            page.fill('input[name*="confirm"]', 'TestPass123!')

            # Submit form
            page.click('button[type="submit"]')
            page.wait_for_load_state('networkidle')

            # Should be redirected to dashboard after signup
            assert '/dashboard' in page.url
            print("✓ Signup successful and redirects to dashboard")

            # Check if user is logged in (should see user menu or logout button)
            logout_button = page.locator('button, a').filter(has_text='Logout').first
            assert logout_button.is_visible()
            print("✓ User appears to be logged in")

            # Logout
            logout_button.click()
            page.wait_for_load_state('networkidle')

            # Should be redirected to signin
            assert '/signin' in page.url or 'sign-in' in page.url.lower()
            print("✓ Logout successful and redirects to signin")

            print("✅ All login/logout tests passed!")

        except Exception as e:
            print(f"❌ Test failed: {e}")
            page.screenshot(path='/tmp/test_failure.png')
            raise

        finally:
            browser.close()

if __name__ == '__main__':
    test_login_logout()