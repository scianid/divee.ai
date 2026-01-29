// Simple test to verify the app loads
// Paste this in your browser console

console.log('=== DIVEE.AI DEBUG TEST ===')

// 1. Check if React is loaded
console.log('1. React loaded:', !!window.React || !!document.getElementById('root')?.innerHTML)

// 2. Check session storage
console.log('2. Session storage:', sessionStorage.getItem('auth_session'))

// 3. Check if AuthContext logs appeared
console.log('3. Look for [AuthContext] logs above ↑')

// 4. Try to access Supabase
console.log('4. Supabase client exists:', typeof window !== 'undefined')

// 5. Check for any errors
console.log('5. Check for red errors above ↑')

// If you see NO logs at all, the app might not be starting
// Check: 
// - Is the dev server running? (npm run dev)
// - Any build errors in terminal?
// - Is the browser showing a blank white page?
