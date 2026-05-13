const fs = require('fs');

// Read the appsData file
const content = fs.readFileSync('dist/assets/appsData-Bu1xF4ZZ.js', 'utf8');

// Extract the O array which contains all thumbnail data
const match = content.match(/const O=\[([\s\S]*?)\]/);
if (!match) {
    console.error('Could not find thumbnail data');
    process.exit(1);
}

const thumbnailsData = match[1];

// Parse the thumbnail objects
const thumbnails = [];
let currentObject = '';
let braceCount = 0;
let inObject = false;

for (let i = 0; i < thumbnailsData.length; i++) {
    const char = thumbnailsData[i];
    
    if (char === '{') {
        braceCount++;
        inObject = true;
    }
    
    if (inObject) {
        currentObject += char;
    }
    
    if (char === '}') {
        braceCount--;
        if (braceCount === 0 && inObject) {
            try {
                // Clean up the object string for parsing
                let cleanObject = currentObject;
                
                // Add quotes around unquoted keys
                cleanObject = cleanObject.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
                
                // Handle the alt text which contains special characters
                cleanObject = cleanObject.replace(/alt:\s*`([^`]*)`/g, (match, content) => {
                    return `alt:"${content.replace(/"/g, '\\"')}"`;
                });
                
                // Handle the prompt text
                cleanObject = cleanObject.replace(/prompt:\s*`([^`]*)`/g, (match, content) => {
                    return `prompt:"${content.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
                });
                
                const obj = JSON.parse(cleanObject);
                thumbnails.push(obj);
                
            } catch (e) {
                console.error('Error parsing object:', currentObject.substring(0, 200) + '...');
                console.error('Error:', e.message);
            }
            
            currentObject = '';
            inObject = false;
        }
    }
}

console.log(`Found ${thumbnails.length} thumbnails`);

// Create organized data structure
const organizedThumbnails = {
    byAppId: {},
    byCategory: {},
    totalCount: thumbnails.length
};

// Organize by app ID
thumbnails.forEach(thumb => {
    const appId = thumb.metadata.appId;
    organizedThumbnails.byAppId[appId] = thumb;
    
    const category = thumb.metadata.category;
    if (!organizedThumbnails.byCategory[category]) {
        organizedThumbnails.byCategory[category] = [];
    }
    organizedThumbnails.byCategory[category].push(thumb);
});

// Save organized data
fs.writeFileSync('thumbnail_inventory.json', JSON.stringify(organizedThumbnails, null, 2));

console.log('Thumbnail inventory saved to thumbnail_inventory.json');

// Generate mapping for app routing
const appThumbnailMapping = {};
Object.entries(organizedThumbnails.byAppId).forEach(([appId, thumb]) => {
    appThumbnailMapping[appId] = {
        url: thumb.url,
        alt: thumb.alt,
        category: thumb.metadata.category
    };
});

fs.writeFileSync('app_thumbnail_mapping.json', JSON.stringify(appThumbnailMapping, null, 2));

console.log('App thumbnail mapping saved to app_thumbnail_mapping.json');

// Print summary
console.log('\n=== THUMBNAIL INVENTORY SUMMARY ===');
console.log(`Total thumbnails: ${thumbnails.length}`);

console.log('\nThumbnails by category:');
Object.entries(organizedThumbnails.byCategory).forEach(([category, thumbs]) => {
    console.log(`  ${category}: ${thumbs.length}`);
});

console.log('\nSample thumbnails:');
thumbnails.slice(0, 5).forEach((thumb, i) => {
    console.log(`${i + 1}. ${thumb.metadata.appId}: ${thumb.url}`);
});
