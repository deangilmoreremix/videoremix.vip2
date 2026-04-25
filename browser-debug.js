// Simple test to check browser storage and auth persistence
console.log('🔍 Browser Storage & Auth Debug Test');

// Check localStorage
console.log('📦 localStorage check:');
try {
  const keys = Object.keys(localStorage);
  console.log(`   Keys found: ${keys.length}`);
  keys.forEach(key => {
    if (key.includes('auth') || key.includes('session')) {
      console.log(`   ${key}: ${localStorage.getItem(key)?.substring(0, 50)}...`);
    }
  });
} catch (error) {
  console.error('   ❌ localStorage error:', error);
}

// Check sessionStorage
console.log('📦 sessionStorage check:');
try {
  const keys = Object.keys(sessionStorage);
  console.log(`   Keys found: ${keys.length}`);
  keys.forEach(key => {
    if (key.includes('auth') || key.includes('session')) {
      console.log(`   ${key}: ${sessionStorage.getItem(key)?.substring(0, 50)}...`);
    }
  });
} catch (error) {
  console.error('   ❌ sessionStorage error:', error);
}

// Test basic Supabase client
console.log('🔧 Supabase client test:');
import { supabase } from './utils/supabaseClient';

(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('   ❌ getSession error:', error);
    } else {
      console.log('   ✅ getSession works');
      console.log(`   Session exists: ${!!data.session}`);
      if (data.session) {
        console.log(`   User: ${data.session.user?.email}`);
        console.log(`   Expires: ${new Date(data.session.expires_at * 1000).toISOString()}`);
      }
    }
  } catch (error) {
    console.error('   ❌ Supabase client error:', error);
  }

  // Test auth state listener
  console.log('👂 Setting up auth listener...');
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log(`   🔄 Auth event: ${event}`, {
      hasSession: !!session,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString()
    });
  });

  // Cleanup after 5 seconds
  setTimeout(() => {
    console.log('🧹 Cleaning up listener');
    subscription.unsubscribe();
  }, 5000);
})();