const products = [
  "AI Personalized Content Hub",
  "FunnelCraft AI",
  "AI Skills Monetizer",
  "AI Skills & Resume",
  "AI Skills Monetizer Pro",
  "Sales Page Builder",
  "Sales Page Builder Pro",
  "Sales Assistant Pro",
  "Sales Assistant Platform",
  "AI Personalization Studio",
  "AI Screen Recorder",
  "AI Screen Recorder Pro",
  "AI Signature",
  "AI Signature Pro",
  "Profile Gen",
  "Profile Generator Pro",
  "Smart CRM Closer Pro",
  "AI Referral Maximizer Pro",
  "AI Sales Maximizer",
  "AI Video Editor",
  "Video AI Editor Pro",
  "VideoEmail App",
  "ContentAI",
  "SmartAnimator",
  "LuminaAI AI Studio Gemini",
  "Product Research AI",
  "ContactsHub",
  "AI Studio",
  "AI Insight Module",
  "AI Screen Recorder Gold",
  "White Label Management App",
  "AI Brand Creator 2",
  "AI Brand Creator Analysis",
  "AI Skills Monetizer with Walkthrough",
  "AI Rebranding Calculator",
  "VideoRemix Special Offer Landing Page",
  "Elevate Rebranding Accelerator",
  "AI Video Recorder Remotion",
  "Business Brander AI Recraft",
  "Power Hour Webinar Landing Page",
  "Resume AI",
  "VideoRemix Power Hour 2 Page",
  "AI Signature App 1",
  "URL Video 2",
  "Video Generation Templates",
  "Personalizer Website",
  "Video AI Pro"
];

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '') + '-product';
}

function generateAppSlug(slug) {
  return slug.replace('-product', '');
}

let sql = 'INSERT INTO products_catalog (id, name, slug, sku, description, product_type, apps_granted, is_active, created_at, updated_at) VALUES\n';

products.forEach((name, index) => {
  const slug = generateSlug(name);
  const appSlug = generateAppSlug(slug);
  const sku = `APP-NEW-${(index + 1).toString().padStart(3, '0')}`;
  const description = `Access to ${name}`;
  const productType = 'one_time';
  const appsGranted = `["${appSlug}"]`; // JSON array syntax for jsonb
  const isActive = true;
  const now = 'NOW()';

  sql += `(gen_random_uuid(), '${name.replace(/'/g, "''")}', '${slug}', '${sku}', '${description.replace(/'/g, "''")}', '${productType}', '${appsGranted}', ${isActive}, ${now}, ${now})`;

  if (index < products.length - 1) {
    sql += ',\n';
  } else {
    sql += ';\n';
  }
});

console.log(sql);