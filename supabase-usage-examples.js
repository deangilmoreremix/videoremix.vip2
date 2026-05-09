/**
 * Supabase Usage Examples
 * 
 * The supabase client is already set up in src/utils/supabaseClient.ts
 * Just import and use it as shown below:
 */

// ✅ IMPORT THE CLIENT
import { supabase } from '../utils/supabaseClient'

// ============ DATA OPERATIONS ============

// 1. SELECT - Fetch data from a table
async function getApps() {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching apps:', error)
    return []
  }
  return data
}

// 2. INSERT - Add new data
async function addApp(newApp) {
  const { data, error } = await supabase
    .from('apps')
    .insert([newApp])
    .select()

  if (error) {
    console.error('Error adding app:', error)
    return null
  }
  return data
}

// 3. UPDATE - Modify existing data
async function updateApp(id, updates) {
  const { data, error } = await supabase
    .from('apps')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating app:', error)
    return null
  }
  return data
}

// 4. DELETE - Remove data
async function deleteApp(id) {
  const { error } = await supabase
    .from('apps')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting app:', error)
    return false
  }
  return true
}

// ============ AUTH OPERATIONS ============

// 5. SIGN UP - Create new user
async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })

  if (error) {
    console.error('Sign up error:', error)
    return null
  }
  return data
}

// 6. SIGN IN - Login user
async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    console.error('Sign in error:', error)
    return null
  }
  return data
}

// 7. SIGN OUT - Logout user
async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Sign out error:', error)
  }
}

// 8. GET CURRENT USER
async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Get user error:', error)
    return null
  }
  return user
}

// ============ REAL-TIME SUBSCRIPTIONS ============

// 9. SUBSCRIBE TO CHANGES
function subscribeToApps(callback) {
  const subscription = supabase
    .channel('apps_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'apps' },
      (payload) => {
        console.log('Change received!', payload)
        callback(payload)
      }
    )
    .subscribe()

  return subscription
}

// ============ USAGE IN REACT COMPONENTS ============

/*
// In your React component:
import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

function MyComponent() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchApps() {
      const { data } = await supabase
        .from('apps')
        .select('*')
        .order('sort_order', { ascending: true })

      if (data) {
        setApps(data)
      }
      setLoading(false)
    }

    fetchApps()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {apps.map(app => (
        <div key={app.id}>{app.name}</div>
      ))}
    </div>
  )
}
*/

export {
  getApps,
  addApp,
  updateApp,
  deleteApp,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  subscribeToApps
}
