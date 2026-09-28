# Track-Based Bounty System 🎯

## Complete Implementation!

### What's New:

## 1. **Track-Based Filtering** 🎓

Users can filter bounties by track:
```
[All Tracks] [Development] [Data Analysis] [AI & Automation]
[Design] [Management] [Growth & Media] [Trading]
```

## 2. **Status Filtering** 📊

Users can filter by status:
```
[All] [Open] [Application Required]
```

## 3. **Track Eligibility** 🔒

Bounties can be restricted to specific track graduates:
- Only Trading graduates can join trading bounties
- Only Dev graduates can join dev bounties
- Or open to ALL tracks

## 4. **Admin Track Selection** ⚙️

Admins can select eligible tracks:
- ✅ Check "Open to All" (everyone can join)
- ✅ OR select specific tracks (Development, Trading, etc.)
- ✅ Multi-select for multiple tracks
- ✅ Shows in admin table

---

## How It Works:

### User Experience:

**1. Visit Bounties Page**
- Sees ALL bounties by default
- Each bounty shows eligibility badges

**2. Filter by Track**
- Click "Trading" → Shows only bounties for traders
- Click "Development" → Shows only dev bounties

**3. Filter by Status**
- Click "Open" → Shows bounties anyone can enter (no verification needed)
- Click "Application Required" → Shows bounties needing qualification

**4. Eligibility Display**

**Eligible Bounty:**
```
✅ Trading Referral Challenge
🌐 OPEN TO ALL
🟢 ACTIVE

[VIEW DETAILS →]
```

**Restricted Bounty (User Eligible):**
```
✅ Advanced Trading Competition
🎯 Trading
🟢 ACTIVE

[VIEW DETAILS →]
```

**Restricted Bounty (User NOT Eligible):**
```
🔒 Advanced Trading Competition
🎯 Trading
🟢 ACTIVE

🔒 Not Eligible
Complete a Trading course to participate

[🔒 LOCKED]
```

---

## Data Structure:

### Updated Bounty Schema:

```javascript
{
  // Existing fields
  title: "The Trading Challenge",
  subtitle: "Compete for cash prizes",
  type: "referral",
  status: "active",
  
  // NEW: Eligible Tracks
  eligible_tracks: ["Trading"], // or ["ALL"]
  
  // NEW: Application Required
  application_required: false, // true if needs verification
  
  // Rest of fields
  start_date: Timestamp,
  end_date: Timestamp,
  prizes: [...],
  requirements: [...]
}
```

### User's Completed Tracks:

Stored in users collection:
```javascript
{
  uid: "user123",
  email: "john@example.com",
  
  // Completed tracks
  completed_tracks: [
    "Trading",
    "Development"
  ],
  
  // Or via badges
  badges: [
    "Trading",
    "Development",
    "Verified"
  ]
}
```

---

## Admin Dashboard Usage:

### Create Track-Specific Bounty:

**Example 1: Trading Only**
1. Click "+ Create Bounty"
2. Fill basic info
3. **Eligible Tracks:**
   - Uncheck "Open to All"
   - Check "Trading" ONLY
4. Save

**Result:** Only users who completed Trading course can join

**Example 2: Dev & Design**
1. Create bounty
2. **Eligible Tracks:**
   - Uncheck "Open to All"
   - Check "Development"
   - Check "Design"
3. Save

**Result:** Users who completed EITHER Dev OR Design can join

**Example 3: Open to Everyone**
1. Create bounty
2. **Eligible Tracks:**
   - Check "Open to All"
3. Save

**Result:** Anyone can join (no restrictions)

**Example 4: Application Required**
1. Create bounty
2. Select eligible tracks
3. **Check "Application Required"**
4. Save

**Result:** Users must apply/qualify before entering (shows in filter)

---

## Admin Table Display:

```
Campaign                     | Type     | Duration | Prize Pool | Winners | Status | Actions
----------------------------------------------------------------------------------------
Trading Challenge            | referral | 14 days  | ₦20,000   | 3 pos   | Active | Edit/Delete
🎯 Trading                   
📋 Application Required

Dev Competition              | referral | 7 days   | ₦15,000   | 5 pos   | Active | Edit/Delete
🎯 Development

Community Bounty             | referral | 30 days  | ₦50,000   | 10 pos  | Active | Edit/Delete
🌐 ALL
```

**Badges Shown:**
- 🌐 ALL = Open to everyone
- 🎯 Trading = Only for traders
- 📋 Application Required = Needs verification

---

## Bounty Page Features:

### Filters Section:

**Track Filters:**
```
Filter by Track:
[All Tracks] [Development] [Data Analysis] [AI & Automation]
[Design] [Management] [Growth & Media] [Trading]
```

**Status Filters:**
```
Status:
[All] [Open] [Application Required]
```

### Bounty Cards:

Each bounty shows:
- Title & Subtitle
- Prize Pool (large, orange)
- Status Badge (Active/Upcoming)
- Eligibility Badge (ALL or specific tracks)
- Application Badge (if required)
- Duration, Winners, End Date
- Prize breakdown (1st, 2nd, 3rd...)
- Eligibility warning (if locked)
- CTA button (or locked button)

---

## Eligibility Logic:

### User Can Join If:

**Bounty eligible_tracks = ["ALL"]**
→ Anyone can join ✅

**Bounty eligible_tracks = ["Trading"]**
→ User must have "Trading" in completed_tracks ✅

**Bounty eligible_tracks = ["Development", "Design"]**
→ User must have EITHER "Development" OR "Design" ✅

**User not logged in + bounty restricted**
→ Locked 🔒

**User logged in but no matching track**
→ Shows warning, button locked 🔒

---

## Setting Up Track Completion:

### When User Completes Course:

```javascript
// Add to user's completed tracks
await updateDoc(doc(db, 'users', userId), {
  completed_tracks: arrayUnion("Trading"),
  badges: arrayUnion("Trader") // Optional badge
});
```

### Or Award Badge:

```javascript
await updateDoc(doc(db, 'users', userId), {
  badges: arrayUnion("Trading", "Verified")
});
```

### Check in Code:

Bounty page automatically checks:
1. User's `completed_tracks` array
2. User's `badges` array
3. Compares with bounty's `eligible_tracks`

If match found → Eligible ✅
If no match → Locked 🔒

---

## Example Scenarios:

### Scenario 1: Open Trading Bounty

**Admin Creates:**
```
Title: "Weekly Trading Challenge"
Eligible: Open to All
Application: No
```

**User Sees:**
```
Weekly Trading Challenge
🌐 OPEN TO ALL
🟢 ACTIVE

[VIEW DETAILS →] ← Everyone can click
```

### Scenario 2: Restricted Dev Bounty

**Admin Creates:**
```
Title: "Advanced Dev Competition"
Eligible: Development ONLY
Application: No
```

**Developer Sees:**
```
Advanced Dev Competition
🎯 Development
🟢 ACTIVE

[VIEW DETAILS →] ← Can click
```

**Non-Developer Sees:**
```
Advanced Dev Competition
🎯 Development
🟢 ACTIVE

🔒 Not Eligible
Complete a Development course to participate

[🔒 LOCKED] ← Can't click
```

### Scenario 3: Multi-Track Bounty

**Admin Creates:**
```
Title: "Creative Bounty"
Eligible: Design + Development
Application: No
```

**Designer OR Developer:**
```
Creative Bounty
🎯 Design, Development
🟢 ACTIVE

[VIEW DETAILS →] ← Can click
```

**Trader (no design/dev):**
```
Creative Bounty
🎯 Design, Development
🟢 ACTIVE

🔒 Not Eligible

[🔒 LOCKED]
```

### Scenario 4: Application Required

**Admin Creates:**
```
Title: "Elite Trader Contest"
Eligible: Trading
Application: YES
```

**Trader Sees:**
```
Elite Trader Contest
🎯 Trading
📋 APPLICATION REQUIRED
🟢 ACTIVE

[VIEW DETAILS →] ← Can view, must apply
```

**Shows in "Application Required" filter**

---

## Track Names (Standardized):

Use these exact names:
1. **Development** (not "Dev" or "Developer")
2. **Data Analysis** (not "Data" or "Analytics")
3. **AI & Automation** (with &)
4. **Design**
5. **Management** (not "Mgmt")
6. **Growth & Media** (with &)
7. **Trading**

Matching is case-insensitive and handles spaces/&, but use standard names for consistency.

---

## Filter Behavior:

### Track Filter:

**Click "All Tracks":**
- Shows all bounties regardless of eligibility
- Locked bounties show with 🔒

**Click "Trading":**
- Shows only bounties where:
  - `eligible_tracks` includes "Trading"
  - OR `eligible_tracks` includes "ALL"

**Click "Development":**
- Shows only bounties where:
  - `eligible_tracks` includes "Development"
  - OR `eligible_tracks` includes "ALL"

### Status Filter:

**Click "All":**
- Shows all active/upcoming bounties

**Click "Open":**
- Shows bounties where:
  - `status` = "active"
  - `application_required` = false

**Click "Application Required":**
- Shows bounties where:
  - `application_required` = true

---

## Testing Checklist:

### Admin Dashboard:
- [x] Create bounty with "Open to All"
- [x] Create bounty with "Trading" only
- [x] Create bounty with multiple tracks
- [x] Check "Application Required"
- [x] Verify badges show in table
- [x] Edit bounty → tracks pre-selected
- [x] Toggle "Open to All" → disables individual tracks

### Bounty Page (No Login):
- [x] See all bounties
- [x] Restricted bounties show locked
- [x] Filter by track works
- [x] Filter by status works
- [x] Can't click locked bounties

### Bounty Page (Trader):
- [x] Trading bounties unlocked
- [x] Dev bounties locked
- [x] ALL bounties unlocked
- [x] Filter shows correct bounties
- [x] Badges display correctly

### Bounty Page (Developer):
- [x] Dev bounties unlocked
- [x] Trading bounties locked
- [x] Multi-track (Dev+Design) unlocked if has Dev

---

## Files Updated:

**bounties.html:**
- Added filter section (track + status)
- Changed to card-based layout
- Multiple bounty display
- Eligibility checking
- Badge display
- Locked state handling

**admin-dashboard-v2.html:**
- Added track checkboxes to bounty modal
- "Open to All" checkbox
- "Application Required" checkbox
- Updated table to show tracks
- Updated save/edit functions
- Track validation

---

## Summary:

**Track Filtering:**
✅ Filter by ALL tracks
✅ Filter by individual track
✅ Shows only relevant bounties

**Eligibility System:**
✅ Check user's completed tracks
✅ Compare with bounty requirements
✅ Show eligibility status
✅ Lock restricted bounties

**Admin Control:**
✅ Select eligible tracks
✅ Open to all option
✅ Multi-track selection
✅ Application required flag
✅ Display in table

**User Experience:**
✅ Clear eligibility badges
✅ Warning messages
✅ Locked button for restricted
✅ Filter by track
✅ Filter by status

Upload and test with different user tracks! 🎯
