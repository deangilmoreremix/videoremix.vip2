#!/usr/bin/env python3
"""
Manually add thumbnail images to ToolsHubPage tool cards
"""

# Read the file
with open('src/pages/ToolsHubPage.tsx', 'r') as f:
    content = f.read()

# Find the tool card opening and add thumbnail section
old_pattern = '''                      className="bg-gray-800/70 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors group"
                    >
                      <div className="block p-6">'''

new_replacement = '''                      className="bg-gray-800/70 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700 hover:border-primary-500/50 transition-colors group"
                    >
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
                      <div className="block p-6">'''

content = content.replace(old_pattern, new_replacement)

# Write back
with open('src/pages/ToolsHubPage.tsx', 'w') as f:
    f.write(content)

print("✅ Manually added thumbnail images to ToolsHubPage tool cards")
