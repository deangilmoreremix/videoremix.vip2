#!/usr/bin/env python3
"""
Create thumbnail mapping for VideoRemix apps
"""

import json
import re
from pathlib import Path

def extract_thumbnail_data():
    """Extract thumbnail URLs and app IDs from the compiled JavaScript"""
    
    # Read the compiled JavaScript file
    with open('dist/assets/appsData-Bu1xF4ZZ.js', 'r') as f:
        content = f.read()
    
    # Extract URLs
    url_pattern = r'url:"([^"]*)"'
    urls = re.findall(url_pattern, content)
    
    # Extract app IDs
    app_id_pattern = r'appId:"([^"]*)"'
    app_ids = re.findall(app_id_pattern, content)
    
    # Extract categories
    category_pattern = r'category:"([^"]*)"'
    categories = re.findall(category_pattern, content)
    
    # Extract alt text (clean it up)
    alt_pattern = r'alt:"([^"]*)"'
    alts = re.findall(alt_pattern, content)
    
    # Create mapping
    thumbnail_mapping = {}
    
    for i, app_id in enumerate(app_ids):
        if i < len(urls) and i < len(categories) and i < len(alts):
            thumbnail_mapping[app_id] = {
                'url': urls[i],
                'category': categories[i],
                'alt': alts[i],
                'filename': urls[i].split('/')[-1] if urls[i] else ''
            }
    
    return thumbnail_mapping

def update_app_config(thumbnails):
    """Update the appUrls.ts file to include thumbnail URLs"""
    
    # Read current appUrls.ts
    with open('src/config/appUrls.ts', 'r') as f:
        content = f.read()
    
    # Create enhanced version with thumbnails
    enhanced_content = content
    
    # Add thumbnail mapping at the end
    thumbnail_mapping_code = "\n// Thumbnail mappings\nexport const THUMBNAIL_URLS: Record<string, string> = {\n"
    
    for app_id, data in thumbnails.items():
        thumbnail_mapping_code += f'  "{app_id}": "{data["url"]}",\n'
    
    thumbnail_mapping_code += "};\n\n"
    thumbnail_mapping_code += "export const getThumbnailUrl = (appId: string): string => {\n"
    thumbnail_mapping_code += "  return THUMBNAIL_URLS[appId] || '';\n"
    thumbnail_mapping_code += "};\n"
    
    # Insert before the last export
    enhanced_content = enhanced_content.replace(
        'export type UrlCategory = (typeof URL_CATEGORIES)[keyof typeof URL_CATEGORIES];',
        'export type UrlCategory = (typeof URL_CATEGORIES)[keyof typeof URL_CATEGORIES];\n\n' + thumbnail_mapping_code
    )
    
    # Write back
    with open('src/config/appUrls.ts', 'w') as f:
        f.write(enhanced_content)
    
    print(f"Updated appUrls.ts with {len(thumbnails)} thumbnail mappings")

def update_app_data(thumbnails):
    """Update app data in the database or configuration"""
    
    # Create a JSON file for reference
    with open('thumbnail_data.json', 'w') as f:
        json.dump(thumbnails, f, indent=2)
    
    print(f"Created thumbnail_data.json with {len(thumbnails)} entries")
    
    # Print summary
    categories = {}
    for app_id, data in thumbnails.items():
        cat = data['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(app_id)
    
    print("\nThumbnails by category:")
    for cat, apps in categories.items():
        print(f"  {cat}: {len(apps)} thumbnails")
    
    print(f"\nTotal thumbnails: {len(thumbnails)}")

def main():
    print("🔍 Extracting thumbnail data from VideoRemix build...")
    
    thumbnails = extract_thumbnail_data()
    
    print(f"✅ Found {len(thumbnails)} thumbnail mappings")
    
    # Update configuration files
    update_app_config(thumbnails)
    update_app_data(thumbnails)
    
    print("\n🎯 Next steps:")
    print("1. Update component imports to use getThumbnailUrl()")
    print("2. Add proper image sizing and centering CSS")
    print("3. Test thumbnail display on landing page and dashboard")

if __name__ == "__main__":
    main()
