# Admin Panel UI - Draw Settings Setup Guide

## Overview
This guide helps you understand what UI elements need to be added to the admin panel to manage draw execution settings.

---

## Settings Panel Location

**Navigation Path:**
```
Admin Panel → Settings → Draw Configuration
```

**API Endpoint:**
```
GET/PUT /api/admin/settings
```

---

## UI Components Required

### 1. Toggle: Include Spin Tokens in Draw

**Component Type:** Boolean Toggle Switch

**Label:** "Include Spin Tokens in Draws"

**Description:** 
```
Enable this to allow users who won tokens from the daily 
spin wheel to participate in draw selection.
```

**Field Name:** `includeSpinTokensInDraw`

**States:**
```
✓ Enabled (ON)  - Spin tokens included
✗ Disabled (OFF) - Spin tokens ignored
```

**UI Example:**
```
┌─────────────────────────────────────────┐
│ ☐ Include Spin Tokens in Draws         │
│                                         │
│ When enabled, users can win draws      │
│ using tokens from daily spins.         │
│                                         │
│ [Toggle: OFF] ←→ [Toggle: ON]         │
└─────────────────────────────────────────┘
```

---

### 2. Slider: Spin Token Weight Multiplier

**Component Type:** Number Range Slider

**Label:** "Spin Token Weight Multiplier"

**Description:**
```
Adjust how much weight spin tokens have compared to 
purchased tokens (1.0 = equal weight)
```

**Field Name:** `spinTokenWeightMultiplier`

**Range:** `0.1` to `5.0`

**Default:** `1.0`

**Step:** `0.1`

**Common Presets:**
```
0.5  - Conservative (spin tokens 50% weight)
1.0  - Fair & Balanced (equal weight)
1.5  - More Engagement (spin tokens 50% more valuable)
2.0  - High Engagement (spin tokens 2x valuable)
```

**UI Example:**
```
┌─────────────────────────────────────────────┐
│ Spin Token Weight Multiplier                │
│                                             │
│ Value: 1.0  [Preset: Fair & Balanced]     │
│                                             │
│ 0.1 ←●──────────────────────────────→ 5.0 │
│     Conservative              Aggressive   │
│                                             │
│ ℹ️ 1.0 = Equal weight as purchased tokens  │
│ ℹ️ 0.5 = Spin tokens half as valuable      │
│ ℹ️ 2.0 = Spin tokens twice as valuable     │
└─────────────────────────────────────────────┘
```

**Display:**
```
Current Multiplier: 1.0x
Interpretation: 
  - 1 spin token = 1 purchased token in draw
  - Equal fairness for all users
```

---

### 3. Dropdown: Draw Execution Mode

**Component Type:** Select Dropdown

**Label:** "Draw Execution Mode"

**Description:**
```
Choose how tokens are considered when executing draws.
```

**Field Name:** `drawExecutionMode`

**Options:**

#### Option 1: Purchased Only
```
Value: "purchased_only"
Label: "Purchased Tokens Only"
Description: "Only purchased tokens count for draws. 
             Spin tokens are bonus rewards only."
```

#### Option 2: All Tokens Equal
```
Value: "all_tokens"
Label: "All Tokens (Purchased + Spin)"
Description: "Both token types treated equally, 
             no distinction between sources."
```

#### Option 3: Purchased & Spin (Recommended)
```
Value: "purchased_and_spin"
Label: "Purchased & Spin (with Multiplier)"
Description: "Both token types included, 
             weight multiplier applied to spin tokens."
```

**UI Example:**
```
┌──────────────────────────────────────────┐
│ Draw Execution Mode                      │
│                                          │
│ Selected: Purchased & Spin               │
│ [▼ Dropdown Menu]                       │
│                                          │
│ Options:                                 │
│ ○ Purchased Tokens Only                 │
│ ○ All Tokens (Equal Weight)             │
│ ● Purchased & Spin (with Multiplier)   │
│                                          │
│ Description:                             │
│ Both token types included, weight        │
│ multiplier applied to spin tokens.       │
└──────────────────────────────────────────┘
```

---

### 4. Number Input: Spin Token Minimum

**Component Type:** Number Input (Optional)

**Label:** "Minimum Spin Tokens for Draw"

**Description:** 
```
Minimum spin tokens a user needs to be eligible 
for draws. (0 = No minimum, allow all)
```

**Field Name:** `spinTokenMinimumForDraw`

**Default:** `0`

**Range:** `0` to `100`

**Current Status:** Future feature (not yet used)

**UI Example:**
```
┌────────────────────────────────────────┐
│ Minimum Spin Tokens Required           │
│                                        │
│ Value: [0___________] (minimum)       │
│                                        │
│ Status: 🔒 Future Feature              │
│ (Currently not enforced)               │
│                                        │
│ ℹ️ Set to 0 for no requirement         │
└────────────────────────────────────────┘
```

---

## Complete Settings Panel Layout

```
╔════════════════════════════════════════════════════╗
║           DRAW EXECUTION SETTINGS                  ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  ✓ Include Spin Tokens in Draws                   ║
║  [Toggle: ON ↔ OFF]                               ║
║  ℹ️ When enabled, spin wheel winners are included │
║                                                    ║
║  ──────────────────────────────────────────────   ║
║                                                    ║
║  Spin Token Weight Multiplier                      ║
║  Value: 1.0                                        ║
║  [Preset: Fair & Balanced]                         ║
║  0.1 ←●─────────────────────────────────→ 5.0    ║
║                                                    ║
║  Current Interpretation:                           ║
║  1 spin token = 1 purchased token                  ║
║                                                    ║
║  ──────────────────────────────────────────────   ║
║                                                    ║
║  Draw Execution Mode                               ║
║  [▼ Purchased & Spin (with Multiplier)]           ║
║                                                    ║
║  Both token types included, weight                 ║
║  multiplier applied to spin tokens.                ║
║                                                    ║
║  ──────────────────────────────────────────────   ║
║                                                    ║
║  Minimum Spin Tokens for Draw                      ║
║  Value: [0___________]  🔒 Future Feature          ║
║                                                    ║
║  ──────────────────────────────────────────────   ║
║                                                    ║
║  [💾 Save Changes]  [↺ Reset]  [ℹ️ Help]          ║
║                                                    ║
║  Last Updated: 2026-05-11 10:30 AM                ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

---

## Configuration Preset Buttons

**Optional Quick Setup:**

```
╔════════════════════════════════════════════════════╗
║  QUICK PRESETS                                     ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  [Conservative]  [Fair]  [Engagement]  [Simple]   ║
║                                                    ║
║  Conservative:                                     ║
║  • Spin tokens: 50% weight                        ║
║  • Mode: Purchased & Spin                         ║
║  • Best for: Maximizing purchases                 ║
║                                                    ║
║  Fair & Balanced:                                  ║
║  • Spin tokens: 100% weight                       ║
║  • Mode: Purchased & Spin                         ║
║  • Best for: Balanced experience                  ║
║                                                    ║
║  High Engagement:                                  ║
║  • Spin tokens: 200% weight                       ║
║  • Mode: Purchased & Spin                         ║
║  • Best for: User engagement                      ║
║                                                    ║
║  Purchased Only:                                   ║
║  • Spin tokens: Ignored                           ║
║  • Mode: Purchased Only                           ║
║  • Best for: Revenue focus                        ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

---

## Info Panel / Help Section

```
╔════════════════════════════════════════════════════╗
║  ℹ️ HELP & INFORMATION                             ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  How Draw Execution Works:                         ║
║                                                    ║
║  1. Admin clicks "Execute Draw"                    ║
║  2. System collects all user tokens:              ║
║     - Purchased tokens (from draw)                ║
║     - Spin tokens (from daily spins)              ║
║  3. Creates a weighted pool:                       ║
║     - Each token = 1 entry in pool                ║
║     - Spin tokens × weight multiplier             ║
║  4. Randomly selects winner(s)                     ║
║  5. Sends winner notification                      ║
║                                                    ║
║  Weight Multiplier Explanation:                    ║
║                                                    ║
║  If multiplier = 1.0 (Fair):                       ║
║    User A: 10 purchased + 2 spin = weight 12      ║
║    User B: 5 purchased + 0 spin = weight 5        ║
║    Probability: A = 70%, B = 30%                  ║
║                                                    ║
║  If multiplier = 0.5 (Conservative):              ║
║    User A: 10 purchased + (2×0.5) spin = 11       ║
║    User B: 5 purchased + 0 spin = weight 5        ║
║    Probability: A = 69%, B = 31%                  ║
║    (Purchased tokens more valuable)               ║
║                                                    ║
║  If multiplier = 2.0 (Engagement):                ║
║    User A: 10 purchased + (2×2.0) spin = 14       ║
║    User B: 5 purchased + 0 spin = weight 5        ║
║    Probability: A = 74%, B = 26%                  ║
║    (Spin tokens more valuable)                    ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

---

## Statistics / Monitoring Panel

```
╔════════════════════════════════════════════════════╗
║  📊 DRAW STATISTICS                                ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  Current Settings:                                 ║
║  Mode: Purchased & Spin                           ║
║  Weight: 1.0x (Fair & Balanced)                   ║
║                                                    ║
║  ──────────────────────────────────────────────   ║
║                                                    ║
║  Active Tokens in System:                          ║
║  • Purchased: 15,420 tokens                        ║
║  • Spin Won: 3,840 tokens                          ║
║  • Total Pool: 19,260 entries                      ║
║                                                    ║
║  Spin Token Participation:                         ║
║  • Users with spin tokens: 892                     ║
║  • Avg tokens per user: 4.3                        ║
║  • Max tokens by user: 12                          ║
║                                                    ║
║  Recent Winners:                                   ║
║  ✓ Ahmad Khan     - Won with 3 spin tokens        ║
║  ✓ Fatima Ali     - Won with 7 purchased tokens   ║
║  ✓ Hassan Ahmed   - Won with 5 spin tokens        ║
║                                                    ║
║  Metrics:                                          ║
║  • Spin wins this month: 8 / 23 (35%)             ║
║  • Avg win tokens: 2.4                             ║
║  • Configuration changed: 3 times                  ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

---

## Implementation Checklist for Frontend

- [ ] Create Settings component in admin panel
- [ ] Add toggle for `includeSpinTokensInDraw`
- [ ] Add slider for `spinTokenWeightMultiplier`
- [ ] Add dropdown for `drawExecutionMode`
- [ ] Add input for `spinTokenMinimumForDraw`
- [ ] Add preset buttons (optional)
- [ ] Add help/info section
- [ ] Add save/reset buttons
- [ ] Add validation (multiplier 0.1-5.0)
- [ ] Add success/error messages
- [ ] Add statistics display (optional)
- [ ] Add last updated timestamp
- [ ] Add loading states during save
- [ ] Add confirmation on major changes

---

## Code Example (React)

```typescript
// Hook for managing draw settings
const [settings, setSettings] = useState({
  includeSpinTokensInDraw: true,
  spinTokenWeightMultiplier: 1.0,
  drawExecutionMode: "purchased_and_spin"
});

const [loading, setLoading] = useState(false);
const [message, setMessage] = useState("");

// Fetch current settings
useEffect(() => {
  (async () => {
    const res = await fetch("/api/admin/settings");
    const data = await res.json();
    setSettings(data);
  })();
}, []);

// Save settings
const handleSave = async () => {
  setLoading(true);
  try {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    setMessage("✅ Settings saved successfully!");
    setSettings(data);
  } catch (error) {
    setMessage("❌ Failed to save settings");
  } finally {
    setLoading(false);
  }
};

// UI Render
return (
  <div className="settings-panel">
    <h2>Draw Execution Settings</h2>
    
    <Toggle
      label="Include Spin Tokens in Draws"
      value={settings.includeSpinTokensInDraw}
      onChange={(val) => setSettings({...settings, includeSpinTokensInDraw: val})}
    />
    
    <Slider
      label="Spin Token Weight Multiplier"
      value={settings.spinTokenWeightMultiplier}
      min={0.1}
      max={5.0}
      step={0.1}
      onChange={(val) => setSettings({...settings, spinTokenWeightMultiplier: val})}
    />
    
    <Select
      label="Draw Execution Mode"
      value={settings.drawExecutionMode}
      options={[
        { value: "purchased_only", label: "Purchased Only" },
        { value: "all_tokens", label: "All Tokens" },
        { value: "purchased_and_spin", label: "Purchased & Spin" }
      ]}
      onChange={(val) => setSettings({...settings, drawExecutionMode: val})}
    />
    
    <button onClick={handleSave} disabled={loading}>
      {loading ? "Saving..." : "Save Changes"}
    </button>
    
    {message && <Alert message={message} />}
  </div>
);
```

---

## User Feedback Messages

### On Save
```
✅ Settings updated successfully!
Draw execution mode will apply to new draws.
```

### On Invalid Input
```
❌ Weight multiplier must be between 0.1 and 5.0
```

### On Configuration Warning
```
⚠️ Purchased Only mode will exclude spin token holders
from participating in draws.
```

### On Confirmation
```
Are you sure you want to change the execution mode?
This will affect all future draws.
[Cancel] [Confirm]
```

---

## Accessibility Requirements

- Label all form inputs
- Add ARIA descriptions
- Keyboard navigation support
- Clear error messages
- High contrast for toggles
- Readable font sizes
- Help tooltips for technical terms

---

## Testing the UI

**Test Cases:**
1. ✅ Toggle on/off `includeSpinTokensInDraw`
2. ✅ Adjust multiplier slider
3. ✅ Change execution mode
4. ✅ Save and reload page (should persist)
5. ✅ Error handling for invalid values
6. ✅ Verify API calls correct
7. ✅ Check responsive design

---

**Created:** 2026-05-11
**Version:** 1.0
**Status:** Ready for Frontend Implementation
