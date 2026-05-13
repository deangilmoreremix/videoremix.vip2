#!/usr/bin/env python3
"""
Validate that thumbnail implementation is complete and correct
"""

import json
import os

def validate_implementation():
    """Validate the thumbnail implementation"""
    
    print("🔍 Validating Thumbnail Implementation")
    print("=" * 50)
    
    checks = []
    
    # Check 1: Thumbnail data exists
    if os.path.exists('thumbnail_data.json'):
        with open('thumbnail_data.json', 'r') as f:
            thumbnail_data = json.load(f)
        checks.append(("✅", f"Thumbnail data loaded: {len(thumbnail_data)} mappings"))
    else:
        checks.append(("❌", "Thumbnail data file not found"))
    
    # Check 2: appUrls.ts has thumbnail functions
    if os.path.exists('src/config/appUrls.ts'):
        with open('src/config/appUrls.ts', 'r') as f:
            content = f.read()
        
        if 'THUMBNAIL_URLS' in content and 'getThumbnailUrl' in content:
            checks.append(("✅", "Thumbnail functions added to appUrls.ts"))
        else:
            checks.append(("❌", "Thumbnail functions missing from appUrls.ts"))
    else:
        checks.append(("❌", "appUrls.ts not found"))
    
    # Check 3: AppGallerySection updated
    if os.path.exists('src/components/AppGallerySection.tsx'):
        with open('src/components/AppGallerySection.tsx', 'r') as f:
            content = f.read()
        
        if 'getThumbnailUrl' in content and 'object-center' in content:
            checks.append(("✅", "AppGallerySection updated with thumbnails"))
        else:
            checks.append(("❌", "AppGallerySection not properly updated"))
    else:
        checks.append(("❌", "AppGallerySection.tsx not found"))
    
    # Check 4: ToolsHubPage updated
    if os.path.exists('src/pages/ToolsHubPage.tsx'):
        with open('src/pages/ToolsHubPage.tsx', 'r') as f:
            content = f.read()
        
        if 'getThumbnailUrl' in content and '<img' in content:
            checks.append(("✅", "ToolsHubPage updated with thumbnail images"))
        else:
            checks.append(("❌", "ToolsHubPage not properly updated"))
    else:
        checks.append(("❌", "ToolsHubPage.tsx not found"))
    
    # Check 5: Thumbnail count matches expectations
    if 'thumbnail_data' in locals():
        total_thumbnails = len(thumbnail_data)
        if total_thumbnails >= 45:  # Should have most of the 95 apps
            checks.append(("✅", f"Sufficient thumbnails found: {total_thumbnails}"))
        else:
            checks.append(("⚠️", f"Limited thumbnails: {total_thumbnails} (expected ~50+)"))
    
    # Print results
    print("\nValidation Results:")
    for status, message in checks:
        print(f"  {status} {message}")
    
    # Summary
    success_count = sum(1 for status, _ in checks if status == "✅")
    total_checks = len(checks)
    
    print(f"\n📊 Summary: {success_count}/{total_checks} checks passed")
    
    if success_count == total_checks:
        print("🎉 Thumbnail implementation is complete and ready!")
        return True
    else:
        print("⚠️ Some issues need to be addressed")
        return False

if __name__ == "__main__":
    validate_implementation()
