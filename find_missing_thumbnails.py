#!/usr/bin/env python3
"""
Find apps that don't have thumbnails and add placeholder URLs
"""

import json
import re

def extract_all_app_ids():
    """Extract all app IDs from APP_URLS in appUrls.ts"""
    with open('src/config/appUrls.ts', 'r') as f:
        content = f.read()
    
    # Find the APP_URLS section
    app_urls_match = re.search(r'export const APP_URLS: Record<string, string> = ({[\s\S]*?});', content)
    if not app_urls_match:
        print("Could not find APP_URLS section")
        return []
    
    app_urls_content = app_urls_match.group(1)
    
    # Extract app IDs
    app_ids = []
    lines = app_urls_content.split('\n')
    for line in lines:
        line = line.strip()
        if line.startswith('"') and '":' in line:
            app_id = line.split('":')[0].strip('"')
            if app_id:
                app_ids.append(app_id)
    
    return app_ids

def get_existing_thumbnails():
    """Get existing thumbnails from THUMBNAIL_URLS"""
    with open('src/config/appUrls.ts', 'r') as f:
        content = f.read()
    
    # Find the THUMBNAIL_URLS section
    thumbnail_match = re.search(r'export const THUMBNAIL_URLS: Record<string, string> = ({[\s\S]*?});', content)
    if not thumbnail_match:
        return {}
    
    thumbnail_content = thumbnail_match.group(1)
    
    # Extract thumbnail mappings
    thumbnails = {}
    lines = thumbnail_content.split('\n')
    for line in lines:
        line = line.strip()
        if line.startswith('"') and '":' in line:
            parts = line.split('":')
            if len(parts) >= 2:
                app_id = parts[0].strip('"')
                url = ':'.join(parts[1:]).strip('",')
                thumbnails[app_id] = url
    
    return thumbnails

def find_missing_thumbnails():
    """Find apps that don't have thumbnails"""
    all_apps = extract_all_app_ids()
    existing_thumbnails = get_existing_thumbnails()
    
    missing = []
    for app in all_apps:
        if app not in existing_thumbnails or not existing_thumbnails[app]:
            missing.append(app)
    
    return missing, existing_thumbnails

def generate_placeholder_thumbnails(missing_apps):
    """Generate placeholder thumbnail URLs for missing apps"""
    placeholders = {}
    
    # Use a consistent base URL for placeholders
    base_url = "https://bzxohkrxcwodllketcpz.supabase.co/storage/v1/object/public/app-assets/thumbnails/"
    
    for i, app_id in enumerate(missing_apps):
        # Generate a consistent filename based on app_id
        filename = f"{app_id.replace('-', '_').replace(' ', '_')}-ai-thumbnail-placeholder.png"
        url = base_url + filename
        placeholders[app_id] = url
    
    return placeholders

def update_thumbnail_urls(missing_thumbnails):
    """Update the THUMBNAIL_URLS in appUrls.ts"""
    
    # Read current file
    with open('src/config/appUrls.ts', 'r') as f:
        content = f.read()
    
    # Find THUMBNAIL_URLS section
    thumbnail_match = re.search(r'(export const THUMBNAIL_URLS: Record<string, string> = \{)([\s\S]*?)(\};)', content)
    
    if not thumbnail_match:
        print("Could not find THUMBNAIL_URLS section")
        return
    
    prefix = thumbnail_match.group(1)
    existing = thumbnail_match.group(2)
    suffix = thumbnail_match.group(3)
    
    # Add missing thumbnails
    additions = []
    for app_id, url in missing_thumbnails.items():
        additions.append(f'  "{app_id}": "{url}",')
    
    new_thumbnails = existing.rstrip() + '\n' + '\n'.join(additions) + '\n'
    
    # Replace in content
    new_content = content.replace(
        prefix + existing + suffix,
        prefix + new_thumbnails + suffix
    )
    
    # Write back
    with open('src/config/appUrls.ts', 'w') as f:
        f.write(new_content)
    
    print(f"Added {len(missing_thumbnails)} placeholder thumbnails")

def main():
    print("🔍 Finding missing thumbnails...")
    
    missing_apps, existing_thumbnails = find_missing_thumbnails()
    
    print(f"Total apps: {len(existing_thumbnails) + len(missing_apps)}")
    print(f"Apps with thumbnails: {len(existing_thumbnails)}")
    print(f"Apps missing thumbnails: {len(missing_apps)}")
    
    if missing_apps:
        print("\nMissing thumbnails for:")
        for app in missing_apps[:10]:  # Show first 10
            print(f"  - {app}")
        if len(missing_apps) > 10:
            print(f"  ... and {len(missing_apps) - 10} more")
        
        # Generate placeholders
        print("\nGenerating placeholder thumbnails...")
        placeholders = generate_placeholder_thumbnails(missing_apps)
        
        # Update the file
        update_thumbnail_urls(placeholders)
        
        print(f"\n✅ Added {len(placeholders)} placeholder thumbnails")
        print("Note: These are placeholder URLs. You'll need to replace them with actual thumbnail images.")
    else:
        print("✅ All apps have thumbnails!")

if __name__ == "__main__":
    main()
