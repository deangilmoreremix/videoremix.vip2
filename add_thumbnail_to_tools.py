#!/usr/bin/env python3
"""
Add thumbnail images to tool cards in ToolsHubPage
"""

import re

# Read the file
with open('src/pages/ToolsHubPage.tsx', 'r') as f:
    content = f.read()

# Add thumbnail image section to tool cards
thumbnail_section = '''                      >
                        {/* Thumbnail Image */}
                        <div className="relative h-32 w-full bg-gray-700/50">
                          <img
                            src={getThumbnailUrl(tool.id)}
                            alt={tool.name}
                            className="w-full h-full object-cover object-center rounded-t-xl"
                            onError={(e) => {
                              // Hide image on error, keep background
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          {/* Gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-gray-800/80 to-transparent rounded-t-xl"></div>
                        </div>
                        <div className="block p-6"'''

# Find the tool card structure and replace
old_pattern = r'                      >\s*<div className="block p-6">'
new_replacement = thumbnail_section

content = re.sub(old_pattern, new_replacement, content, flags=re.MULTILINE | re.DOTALL)

# Write back
with open('src/pages/ToolsHubPage.tsx', 'w') as f:
    f.write(content)

print("✅ Added thumbnail images to tool cards in ToolsHubPage")
