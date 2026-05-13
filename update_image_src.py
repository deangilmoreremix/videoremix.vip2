#!/usr/bin/env python3
"""
Update AppGallerySection.tsx to use thumbnail URLs with proper sizing
"""

import re

# Read the file
with open('src/components/AppGallerySection.tsx', 'r') as f:
    content = f.read()

# Update the image source logic to prioritize thumbnail URLs
new_image_src = '''                    src={
                      imageErrors[app.id]
                        ? getFallbackImage(app.id, imageErrors[app.id])
                        : getThumbnailUrl(app.id) || app.image
                    }'''

# Replace the image src - find the specific pattern
old_src_pattern = r'                    src=\{\s*imageErrors\[app\.id\]\s*\?\s*getFallbackImage\(app\.id,\s*imageErrors\[app\.id\]\)\s*:\s*app\.image\s*\}'
content = re.sub(old_src_pattern, new_image_src, content, flags=re.MULTILINE | re.DOTALL)

# Update the className for better centering
old_class_pattern = r'className=\{`w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out \$\{user && !hasAccessToApp\(app\.id\) \? "grayscale opacity-60" : ""\}`\}'
new_class = '''className={`w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-in-out rounded-lg ${user && !hasAccessToApp(app.id) ? "grayscale opacity-60" : ""}`'''

content = re.sub(old_class_pattern, new_class, content, flags=re.MULTILINE | re.DOTALL)

# Write back
with open('src/components/AppGallerySection.tsx', 'w') as f:
    f.write(content)

print("✅ Updated AppGallerySection.tsx with thumbnail URLs and improved styling")
