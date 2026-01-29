# 🔍 App Not Loading - Troubleshooting Steps

## What You Should See in Console

After adding logging, open your browser DevTools (F12) → Console tab.

You should see these logs in order:

```
=== MAIN.TSX IS LOADING ===
Root element found: true
[AuthContext] Initializing...
[Auth] Getting user session...
[Admin Check] ...
=== APP RENDERED ===
```

---

## If You See NO LOGS AT ALL

### ✅ Step 1: Is the dev server running?

In your terminal, you should see:
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**If not running:**
```bash
cd web
npm run dev
```

---

### ✅ Step 2: Are you on the right URL?

Visit: `http://localhost:5173/`

NOT:
- ❌ `http://localhost:3000/`
- ❌ File:// path
- ❌ Different port

---

### ✅ Step 3: Hard refresh the page

1. Press `Ctrl + Shift + R` (Windows/Linux)
2. Or `Cmd + Shift + R` (Mac)
3. Or clear cache: DevTools → Application → Clear storage

---

### ✅ Step 4: Check terminal for build errors

Look in your terminal where you ran `npm run dev`.

Common errors:
- Missing dependencies: `npm install`
- Port in use: Kill the process or use different port
- Syntax errors: Will show in red

---

## If You See SOME Logs But App Doesn't Render

### Check for these specific logs:

**❌ "[AuthContext] Failed to load session"**
- Admin check might be failing
- Check if Supabase env vars are set

**❌ "[Admin Check] admin_users table does not exist"**
- This is OK! Just means migration not applied yet
- App should still work, just no admin features

**❌ "Root element found: false"**
- Your index.html might be missing `<div id="root"></div>`

---

## If Admin Badge Still Not Showing

**This is expected if:**
1. ✅ Migration not applied yet → Apply migration first
2. ✅ You're not added as admin → Add yourself to admin_users table
3. ✅ You haven't signed out/in yet → Sign out and back in

**Console should show:**
```
[Admin Check] User is not an admin
```

**To become admin:**
1. Apply the migration
2. Add your user to admin_users table
3. Sign out and sign back in
4. You should see: `[Admin Check] User IS an admin!`

---

## Quick Test

Paste this in browser console:

\`\`\`javascript
// Test 1: Is React loaded?
console.log('React root:', document.getElementById('root')?.innerHTML.length > 0)

// Test 2: Is dev server responding?
fetch('/').then(r => console.log('Server status:', r.status))

// Test 3: Console logs working?
console.log('✅ Console is working!')
\`\`\`

---

## Still Not Working?

Share:
1. Screenshot of browser console (F12)
2. Terminal output where you ran `npm run dev`
3. What URL you're visiting
4. Any red error messages
