import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bzxohkrxcwodllketcpz.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eG9oa3J4Y3dvZGxsa2V0Y3B6Iiwicm9sZSI6ImF1b24iLCJpYXQiOjE3NzM4NjYzODUsImV4cCI6MjA4OTQ0MjM4NX0.ExeLy2sWZMnLY4VToGlbqr3F4SpNmrsE9Hw0lyAhb9A";

console.log("Testing Supabase connection...");
console.log("URL:", supabaseUrl);
console.log("Key length:", supabaseAnonKey.length);
console.log("Key starts with:", supabaseAnonKey.substring(0, 20));

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Test signup
const testEmail = `test-direct-${Date.now()}@example.com`;
console.log("\nTesting signup with:", testEmail);

const { data, error } = await supabase.auth.signUp({
  email: testEmail,
  password: "TestPassword123!",
  options: {
    data: { first_name: "Test", last_name: "User" },
    emailConfirm: false,
  }
});

if (error) {
  console.error("❌ Signup failed:", error.message);
  console.error("Error details:", JSON.stringify(error, null, 2));
} else {
  console.log("✅ Signup successful!");
  console.log("User ID:", data.user?.id);
  console.log("Email confirmed:", data.user?.email_confirmed_at ? "Yes" : "No");
  
  // Test login
  console.log("\nTesting login...");
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: "TestPassword123!"
  });
  
  if (loginError) {
    console.error("❌ Login failed:", loginError.message);
  } else {
    console.log("✅ Login successful!");
    console.log("Access token exists:", !!loginData.session?.access_token);
    
    // Test logout
    console.log("\nTesting logout...");
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      console.error("❌ Logout failed:", logoutError.message);
    } else {
      console.log("✅ Logout successful!");
      
      // Verify session cleared
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("Session after logout:", sessionData.session ? "Still exists" : "Cleared ✅");
    }
  }
  
  // Cleanup
  console.log("\nCleaning up test user...");
  // Note: Would need service role key to delete user
}

console.log("\n✨ Test complete!");
