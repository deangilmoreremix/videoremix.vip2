from playwright.sync_api import sync_playwright
import sys

def test_production_site():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console errors
        console_errors = []
        def on_console(msg):
            if msg.type == 'error':
                console_errors.append({
                    'text': msg.text,
                    'location': msg.location if msg.location else None
                })

        page.on('console', on_console)

        try:
            # Navigate to production site
            page.goto('https://videoremix.vip', timeout=30000)
            page.wait_for_load_state('networkidle', timeout=10000)

            # Wait a bit for any async errors
            page.wait_for_timeout(3000)

            # Check if page loaded successfully
            title = page.title()
            print(f"Page title: {title}")

            # Check for any obvious error elements
            error_selectors = [
                '[class*="error"]',
                '[class*="Error"]',
                '.toast-error',
                '.error-message'
            ]

            errors_found = []
            for selector in error_selectors:
                if page.locator(selector).count() > 0:
                    errors_found.append(selector)

            if errors_found:
                print(f"Error elements found: {errors_found}")
            else:
                print("No obvious error elements found")

            # Report console errors
            if console_errors:
                print(f"Console errors found: {len(console_errors)}")
                for i, error in enumerate(console_errors[:5]):  # Show first 5
                    print(f"  {i+1}. {error['text']}")
                    if error['location']:
                        print(f"     Location: {error['location']}")
            else:
                print("✅ No console errors found")

            # Check for Xn component error specifically
            xn_errors = [e for e in console_errors if 'Xn' in e['text']]
            if xn_errors:
                print(f"❌ Xn component errors still present: {len(xn_errors)}")
                return False
            else:
                print("✅ No Xn component errors found")

            return len(console_errors) == 0 and len(errors_found) == 0

        except Exception as e:
            print(f"Error during test: {e}")
            return False
        finally:
            browser.close()

if __name__ == '__main__':
    success = test_production_site()
    print(f"\nTest result: {'PASSED' if success else 'FAILED'}")
    sys.exit(0 if success else 1)