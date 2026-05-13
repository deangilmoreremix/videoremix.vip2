#!/usr/bin/env python3
"""
Update THUMBNAIL_URLS with actual AI-generated thumbnails from generatedThumbnails.ts
"""

import json
import re

# Read the generated thumbnails file
with open('src/data/generatedThumbnails.ts', 'r') as f:
    content = f.read()

# Extract thumbnail data using a simpler approach
thumbnail_entries = []
lines = content.split('\n')

current_entry = {}
in_entry = False

for line in lines:
    line = line.strip()
    
    if line.startswith('{'):
        in_entry = True
        current_entry = {}
    
    elif line.startswith('url:'):
        url_match = re.search(r'url:\s*"([^"]*)"', line)
        if url_match:
            current_entry['url'] = url_match.group(1)
    
    elif 'appId:' in line:
        app_id_match = re.search(r'appId:\s*"([^"]*)"', line)
        if app_id_match:
            current_entry['appId'] = app_id_match.group(1)
    
    elif line.startswith('},') and in_entry:
        in_entry = False
        if 'url' in current_entry and 'appId' in current_entry:
            thumbnail_entries.append(current_entry)

print(f"Found {len(thumbnail_entries)} thumbnail entries")

# Create the thumbnail mapping
thumbnail_mapping = {entry['appId']: entry['url'] for entry in thumbnail_entries}

print(f"Created mapping for {len(thumbnail_mapping)} apps")

# Read current appUrls.ts
with open('src/config/appUrls.ts', 'r') as f:
    app_urls_content = f.read()

# Replace THUMBNAIL_URLS section
thumbnail_urls_section = "export const THUMBNAIL_URLS: Record<string, string> = {\n"

for app_id, url in thumbnail_mapping.items():
    thumbnail_urls_section += f'  "{app_id}": "{url}",\n'

thumbnail_urls_section += "};\n"

# Replace the existing THUMBNAIL_URLS section
old_pattern = r'export const THUMBNAIL_URLS: Record<string, string> = \{[\s\S]*?\};'
app_urls_content = re.sub(old_pattern, thumbnail_urls_section, app_urls_content, flags=re.DOTALL)

# Write back
with open('src/config/appUrls.ts', 'w') as f:
    f.write(app_urls_content)

print("✅ Updated appUrls.ts with actual AI-generated thumbnails")
print(f"✅ Now supporting {len(thumbnail_mapping)} apps with real AI-generated thumbnails")

# Update thumbnail_data.json for reference
with open('thumbnail_data.json', 'w') as f:
    json.dump({
        app_id: {
            'url': url,
            'filename': url.split('/')[-1] if url else '',
            'source': 'ai-generated',
            'quality': 'hd',
            'model': 'dall-e-3'
        }
        for app_id, url in thumbnail_mapping.items()
    }, f, indent=2)

print("✅ Updated thumbnail_data.json with real thumbnail mappings")
