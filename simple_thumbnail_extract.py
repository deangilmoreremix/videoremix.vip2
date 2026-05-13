#!/usr/bin/env python3
"""
Simple extraction of thumbnails from generatedThumbnails.ts
"""

import json

# Read the file
with open('src/data/generatedThumbnails.ts', 'r') as f:
    content = f.read()

# Extract just the array content
start = content.find('[')
end = content.rfind(']') + 1

if start == -1 or end == -1:
    print("Could not find array in file")
    exit(1)

array_content = content[start:end]

# Parse as JSON (it's actually valid JSON structure)
try:
    thumbnails = json.loads(array_content)
    print(f"Successfully parsed {len(thumbnails)} thumbnails")
    
    # Create mapping
    thumbnail_mapping = {}
    for thumb in thumbnails:
        app_id = thumb.get('metadata', {}).get('appId')
        url = thumb.get('url')
        if app_id and url:
            thumbnail_mapping[app_id] = url
    
    print(f"Created mapping for {len(thumbnail_mapping)} apps")
    
    # Update appUrls.ts
    with open('src/config/appUrls.ts', 'r') as f:
        app_urls_content = f.read()
    
    # Create THUMBNAIL_URLS section
    thumbnail_urls_section = "export const THUMBNAIL_URLS: Record<string, string> = {\n"
    
    for app_id, url in thumbnail_mapping.items():
        thumbnail_urls_section += f'  "{app_id}": "{url}",\n'
    
    thumbnail_urls_section += "};\n"
    
    # Replace existing section
    import re
    old_pattern = r'export const THUMBNAIL_URLS: Record<string, string> = \{[\s\S]*?\};'
    app_urls_content = re.sub(old_pattern, thumbnail_urls_section, app_urls_content, flags=re.DOTALL)
    
    with open('src/config/appUrls.ts', 'w') as f:
        f.write(app_urls_content)
    
    print("✅ Updated appUrls.ts with real AI-generated thumbnails")
    
    # Update reference file
    with open('thumbnail_data.json', 'w') as f:
        json.dump({
            app_id: {
                'url': url,
                'filename': url.split('/')[-1] if url else '',
                'source': 'ai-generated-dall-e-3',
                'quality': 'hd'
            }
            for app_id, url in thumbnail_mapping.items()
        }, f, indent=2)
    
    print("✅ Updated thumbnail_data.json")
    
except Exception as e:
    print(f"Error parsing JSON: {e}")
    exit(1)
