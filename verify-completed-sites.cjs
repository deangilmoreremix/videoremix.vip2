#!/usr/bin/env node

// Check status of bulk environment variable updates
const { execSync } = require('child_process');

const completedSites = [
  'fa3ee078-734a-4710-997b-2ea1c275f975', // openclawcrm
  '91317337-b416-4b44-94e9-a852ed448a79', // videoagencyai
  '0563e987-0718-4d58-9406-4bb580fceb13', // smartleadsunited
  'ecb60015-8265-4359-8198-b091c7d43de9', // smartcrmnewdean
  '13aec8af-ec50-44c6-b78b-e6473de8507c', // smartcrmsalespageupgrade
  '42ab2d07-0e71-4646-b032-28fd7b040da7', // smartcrmcloser
  '34cbdbab-c304-4451-9987-897a18c796ac', // smartcrmreplit
  '3e241fa4-6daf-48c8-a46f-73bef1616a36', // videoemail
  '8e29ee49-d9a6-47a4-8358-4bff67003e70', // luminaai-aistudiogemini
  'a4014320-0eeb-451a-b636-e2bb34aa151c', // smartanimator
  '4b16219c-50af-4e70-8f3c-00b69c8afca2', // smartcameos-geminiai
  'ece04aee-3f16-4e6d-9c7a-ff5db0986be3', // smartcrmnew
  '291bd61e-17c3-4dd6-8765-a445afb28dec', // smartcrmlandingfe
  'f3e78f85-b605-4d21-8ea0-caa04562bab9', // jvpartnerpagesmartcrm
  '5dc577a2-e84f-4230-a9e3-43f51a5e0a4c', // videoremix
];

console.log('🔍 Checking status of completed VideoRemix sites...\n');

let verifiedCount = 0;

for (const siteId of completedSites) {
  try {
    // Check if VITE_SUPABASE_URL is set (indicates successful update)
    const result = execSync(`netlify env:get VITE_SUPABASE_URL --site "${siteId}"`, {
      encoding: 'utf8',
      timeout: 10000
    }).trim();

    if (result.includes('bzxohkrxcwodllketcpz')) {
      console.log(`✅ ${siteId} - Environment variables verified`);
      verifiedCount++;
    } else {
      console.log(`❌ ${siteId} - Unexpected value: ${result}`);
    }
  } catch (error) {
    console.log(`❌ ${siteId} - Error checking: ${error.message}`);
  }
}

console.log(`\n📊 Verification Complete:`);
console.log(`  ✅ Verified: ${verifiedCount}/${completedSites.length}`);
console.log(`  📈 Success Rate: ${((verifiedCount/completedSites.length)*100).toFixed(1)}%`);

const remainingSites = [
  'd6c6e9a6-84c5-42b7-9aae-cb1feaa5324e', // smartcrmvip
  '3b5c6a9b-f2f2-4184-9496-fd12035fec9d', // smartcrm2
  'f6ab1cd4-5f57-46c9-9281-dae1aa837589', // smartcrmcloser2
  '53874380-66c2-4103-b836-6fcac0c76df3', // registerforwebinarsmartcrm
  'f33c86b2-8b56-4aa0-a4e6-be1e7dc2c54d', // insightaismartcrm
  '8643ad31-5c81-43e9-8f65-ed31a30f477e', // aiprojecthubvidremix
  'd7ebf9ee-eb0f-4bef-b9ef-878b3d35fc3f', // smartcontentai2
  'a26325be-72bb-451c-947f-b6023452bc94', // videoremixspecialoffer
  'c96ae988-0197-4c0f-8f60-e491d046e8aa', // videoremixpro
  'bb3573aa-297e-4003-b892-8b2c5e581a8d', // resumeairemix
  'a36fe8a7-4bef-4844-b03e-b224e90b6c5a', // ai-resume-builder-vr
  '5ff91d57-383e-4b51-9f76-4546a445e616', // urlvideo2
  'dbb6b7bc-7927-4eca-947b-8d413da38d70', // videogenerationtemplates
  'b959ea1d-4875-4c88-b5ba-745d096b4a6a', // personalizer-ai-image
  'a6e33aa8-5cd0-40a5-9992-b41db7c3a0df', // videoaipro
  '8e0248f2-e577-4a19-b114-ffe1005eb184', // videoremix-dreammachine
  'ddda12ed-ae20-4f79-8524-57be07e7cfc1', // personalizerwebsite
];

console.log(`\n⏭️  Remaining sites to update: ${remainingSites.length}`);
console.log('Ready to continue bulk update for remaining sites! 🚀');