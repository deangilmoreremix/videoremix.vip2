#!/usr/bin/env python3
"""
Comprehensive Authentication Test Suite
Tests all auth flows without email verification
"""

import subprocess
import sys
import os
from pathlib import Path

def run_test(test_script):
    """Run a single test script and return success status"""
    print(f"\n🚀 Running {test_script}...")
    try:
        result = subprocess.run([
            sys.executable, f"tests/auth/{test_script}"
        ], capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print(f"✅ {test_script} PASSED")
            return True, result.stdout
        else:
            print(f"❌ {test_script} FAILED")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return False, result.stdout + result.stderr
            
    except subprocess.TimeoutExpired:
        print(f"⏰ {test_script} TIMED OUT")
        return False, "Test timed out"
    except Exception as e:
        print(f"💥 {test_script} ERROR: {str(e)}")
        return False, str(e)

def main():
    print("🔐 Comprehensive Authentication Test Suite")
    print("=" * 80)
    print("Testing all auth flows without email verification")
    print("=" * 80)
    
    # Test scripts to run
    test_scripts = [
        "password_change_test.py",
        "password_reset_test.py", 
        "signin_test.py",
        "signout_test.py"
    ]
    
    results = []
    all_passed = True
    
    for script in test_scripts:
        if os.path.exists(f"tests/auth/{script}"):
            success, output = run_test(script)
            results.append((script, success, output))
            if not success:
                all_passed = False
        else:
            print(f"⚠️  {script} not found")
            results.append((script, False, "File not found"))
            all_passed = False
    
    # Generate comprehensive report
    print("\n" + "=" * 80)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 80)
    
    for script, success, output in results:
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {script}")
    
    print("\n" + "=" * 80)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Authentication flows work correctly without email verification")
        print("\n📋 Verification Summary:")
        print("   ✅ Pages load correctly")
        print("   ✅ Form validation works")
        print("   ✅ Authentication succeeds/fails appropriately")
        print("   ✅ No email verification triggered")
        print("   ✅ Success states work properly")
        print("   ✅ Error handling is appropriate")
    else:
        print("❌ SOME TESTS FAILED!")
        print("🔍 Check individual test outputs above for details")
    
    print("\n📸 Screenshots saved to /tmp/ for evidence review")
    print("🔗 Test files available in tests/auth/")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
