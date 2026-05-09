#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

// Check the URL project
const urlProject = 'https://hppbanjiifninnbioxyp.supabase.co';
const urlKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwcGJhbmppaWZuaW5uYmlveHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDA2MTYsImV4cCI6MjA3NTA3NjYxNn0.aBtE9Y3ttLv5M0fk4oTPDyTJZvbT8foZ93MeRIVHPq0';

const client = createClient(urlProject, urlKey);

try {
  console.log('Testing connection to:', urlProject);
  const { data, error, count } = await client.from('apps').select('*', { count: 'exact', head: true });

  if (error) {
    console.log('❌ Error:', error.message);
    console.log('This project may not have the apps table or may be empty.');
  } else {
    console.log('✅ Connected successfully!');
    console.log(`Found ${count} apps in this project`);
  }
} catch (err) {
  console.log('❌ Connection failed:', err.message);
}
