# Admin Panel - Draw Execution Settings Guide

## Overview
Admin can now configure how draw execution works, including whether tokens won from the daily spin wheel should be included in draw participation.

---

## New Draw Settings

### 1. **Include Spin Tokens in Draw** 
- **Setting Name:** `includeSpinTokensInDraw`
- **Type:** Boolean
- **Default:** `true`
- **Description:** Enable/disable inclusion of spin wheel-won tokens in draw participation pool

**When Enabled:**
- Users who won tokens from the daily spin wheel are automatically entered into draws
- These tokens count toward draw participation
- Winners can be selected based on spin tokens

**When Disabled:**
- Only purchased tokens count for draws
- Spin wheel tokens are ignored in draw execution
- Spin tokens still remain in user's account

---

### 2. **Spin Token Weight Multiplier**
- **Setting Name:** `spinTokenWeightMultiplier`
- **Type:** Number (decimal)
- **Default:** `1.0`
- **Range:** `0.1` to `5.0`
- **Description:** Adjust how much weight spin tokens have compared to purchased tokens

**Examples:**
- `1.0` = Spin tokens have equal weight as purchased tokens
- `0.5` = Spin tokens have half the weight (less chance to win)
- `2.0` = Spin tokens have double weight (higher chance to win)
- `0.1` = Spin tokens have very low weight (minimal contribution)

**Use Cases:**
- Set to `1.0` for fair treatment
- Set to `0.5` to incentivize token purchases
- Set to `2.0` to reward spin wheel participation

---

### 3. **Spin Token Minimum for Draw**
- **Setting Name:** `spinTokenMinimumForDraw`
- **Type:** Number (integer)
- **Default:** `0`
- **Description:** Minimum spin tokens required for eligibility (currently for future use)

---

### 4. **Draw Execution Mode**
- **Setting Name:** `drawExecutionMode`
- **Type:** String (enum)
- **Default:** `"purchased_and_spin"`
- **Options:**
  - `"purchased_only"` - Only purchased tokens count
  - `"all_tokens"` - All tokens (purchased + spin) count equally
  - `"purchased_and_spin"` - Both counted, respecting weight multiplier

**Mode Explanations:**

#### a) `purchased_only`
```
- Only users with purchased tokens can win
- Spin tokens ignored completely
- Most traditional draw system
```

#### b) `all_tokens`
```
- Purchased tokens and spin tokens treated the same
- No distinction between token sources
- Spin weight multiplier ignored
```

#### c) `purchased_and_spin` (Recommended)
```
- Distinguishes between token sources
- Applies weight multiplier to spin tokens
- Balanced approach
- Spin tokens clearly marked in winner notification
```

---

## How Draw Execution Works (Flow)

### Step 1: Admin Executes Draw
Admin clicks "Execute Draw" button for a specific draw.

### Step 2: System Collects Tokens
```
Purchased Tokens: From cld_tokens collection
Spin Tokens: From cld_spin_history where tokensWon > 0
```

### Step 3: Build Winner Pool
```
If includeSpinTokensInDraw = true:
  - Add all purchased tokens to pool
  - Add spin tokens with weight multiplier applied
  
If includeSpinTokensInDraw = false:
  - Only add purchased tokens to pool
  - Ignore spin tokens
```

### Step 4: Select Winners
- Weighted random selection from combined pool
- Each user's weight = number of tokens they have
- Winners selected with probability weighted by token count

### Step 5: Create Notifications
```
If winner used purchased tokens:
  "You won with purchased tokens"
  
If winner used spin tokens:
  "You won using spin wheel tokens"
  
If winner used both:
  "Congratulations! You won!"
```

### Step 6: Record Win
- Winner marked in draw
- Win recorded in DrawParticipation
- Notification sent to winner
- Draw status changed to "drawn"

---

## Admin Configuration Examples

### Example 1: Conservative (Incentivize Purchases)
```json
{
  "includeSpinTokensInDraw": true,
  "spinTokenWeightMultiplier": 0.5,
  "drawExecutionMode": "purchased_and_spin"
}
```
- Spin tokens count but at 50% weight
- Users with purchased tokens more likely to win
- Encourages token purchases
- Spin wheel still valuable

### Example 2: Fair & Balanced
```json
{
  "includeSpinTokensInDraw": true,
  "spinTokenWeightMultiplier": 1.0,
  "drawExecutionMode": "purchased_and_spin"
}
```
- Spin tokens and purchased tokens equal
- Treats all users fairly
- Rewards both purchasing and daily spins
- Most balanced approach

### Example 3: Reward Spin Participation
```json
{
  "includeSpinTokensInDraw": true,
  "spinTokenWeightMultiplier": 2.0,
  "drawExecutionMode": "purchased_and_spin"
}
```
- Spin tokens count at 200% weight
- Daily spin participation highly valued
- Encourages consistent engagement
- Rewards active users

### Example 4: Purchased Only (Traditional)
```json
{
  "includeSpinTokensInDraw": false,
  "spinTokenWeightMultiplier": 1.0,
  "drawExecutionMode": "purchased_only"
}
```
- Only purchased tokens matter for draws
- Spin wheel is pure bonus (no draw benefit)
- Maximizes revenue from token purchases
- Clear draw mechanism

---

## API Endpoints

### Get Current Settings
```
GET /api/admin/settings
```

**Response:**
```json
{
  "includeSpinTokensInDraw": true,
  "spinTokenWeightMultiplier": 1.0,
  "spinTokenMinimumForDraw": 0,
  "drawExecutionMode": "purchased_and_spin",
  ...other settings
}
```

### Update Settings
```
PUT /api/admin/settings
```

**Request Body:**
```json
{
  "includeSpinTokensInDraw": true,
  "spinTokenWeightMultiplier": 1.5,
  "drawExecutionMode": "purchased_and_spin"
}
```

**Response:**
```json
{
  "includeSpinTokensInDraw": true,
  "spinTokenWeightMultiplier": 1.5,
  "drawExecutionMode": "purchased_and_spin",
  "updatedAt": "2026-05-11T10:30:00Z",
  ...other settings
}
```

### Execute Draw (Existing)
```
POST /api/admin/draws/:id/trigger
```

**Request Body:**
```json
{
  "count": 5
}
```

**Response:**
```json
{
  "ok": true,
  "winner": {
    "userId": "...",
    "userName": "John",
    "prize": "iPhone 15",
    "isSpinTokenWin": true,  // ✨ NEW: Shows if spin tokens used
    ...other data
  },
  "winners": [...]
}
```

---

## Database Changes

### Settings Model (cld_settings)
```json
{
  "_id": ObjectId,
  "includeSpinTokensInDraw": boolean,
  "spinTokenWeightMultiplier": number,
  "spinTokenMinimumForDraw": number,
  "drawExecutionMode": string,
  "updatedAt": Date,
  ...other fields
}
```

### Default Values
```
includeSpinTokensInDraw: true
spinTokenWeightMultiplier: 1.0
spinTokenMinimumForDraw: 0
drawExecutionMode: "purchased_and_spin"
```

---

## Draw Execution Logic (Technical)

### Data Collection Phase
```typescript
// Get purchased tokens
const drawTokens = await Token.find({ drawId, status: "used" });

// Get spin-won tokens (NEW)
const spinHistory = await SpinHistory.aggregate([
  { $match: { tokensWon: { $gt: 0 } } },
  { $group: { _id: "$userId", totalSpinTokens: { $sum: "$tokensWon" } } }
]);
```

### Pool Building Phase
```typescript
// Add purchased tokens
for (token of drawTokens) {
  pool.push({
    userId: token.userId,
    isSpinToken: false
  });
}

// Add spin tokens with weight (NEW)
for (userId, spinCount of spinHistory) {
  const weighted = ceil(spinCount * weightMultiplier);
  for (i = 0; i < weighted; i++) {
    pool.push({
      userId: userId,
      isSpinToken: true
    });
  }
}
```

### Winner Selection Phase
```typescript
// Weighted random selection
for (let i = 0; i < countToSelect; i++) {
  const winner = selectWeightedRandom(pool);
  winners.push(winner);
  pool.removeAllOfUser(winner.userId);
}
```

### Result Recording Phase
```typescript
// Mark in draw
draw.winners.push({
  userId: winner.userId,
  isSpinTokenWin: winner.isSpinToken // ✨ NEW
});

// Create notification
notification.message = winner.isSpinToken 
  ? "You won using spin wheel tokens"
  : "You won with purchased tokens";
```

---

## Monitoring & Reporting

### Check Spin Token Participation
```
GET /api/admin/analytics
```
- View how many users won via spin tokens
- Track spin token contribution to draws
- Monitor weight multiplier impact

### View Winner Details
```
GET /api/admin/winners
```
- See which tokens won (purchased vs spin)
- Track token source distribution
- Analyze user behavior

---

## Best Practices

### 1. **Set Weight Multiplier Wisely**
- Start with `1.0` (equal weight)
- Monitor draw participation rates
- Adjust based on business goals

### 2. **Communicate with Users**
- Explain if spin tokens give draw benefits
- Update terms when changing settings
- Be transparent about mechanics

### 3. **Regular Audits**
- Check spin token distribution quarterly
- Verify winner fairness
- Monitor engagement metrics

### 4. **A/B Testing**
- Test different weight multipliers
- Compare user engagement
- Find optimal configuration

### 5. **Keep Audit Trail**
- Settings changes logged
- Track weight multiplier history
- Document business rationale

---

## Troubleshooting

### Issue: Spin Token Winners Not Appearing
**Solution:** 
- Verify `includeSpinTokensInDraw` is `true`
- Check `drawExecutionMode` is not `"purchased_only"`
- Ensure spin tokens exist in database
- Verify mode is `"purchased_and_spin"` or `"all_tokens"`

### Issue: Spin Tokens Weighted Too High/Low
**Solution:**
- Adjust `spinTokenWeightMultiplier`
- Run test draws
- Monitor win rates
- Communicate changes to users

### Issue: Settings Not Applied
**Solution:**
- Clear admin panel cache
- Verify API request succeeded
- Check updated settings response
- Restart backend if needed

---

## Migration Guide

### If You Had Purchased-Only System
```json
// OLD Configuration (hidden)
- Draws only used purchased tokens
- Spin tokens ignored

// NEW Configuration (switch to)
{
  "includeSpinTokensInDraw": true,
  "spinTokenWeightMultiplier": 1.0,
  "drawExecutionMode": "purchased_and_spin"
}
```

### Backward Compatibility
- Old draws unaffected
- New setting only applies to new draws
- Can toggle on/off anytime
- No data migration needed

---

## FAQ

**Q: Will existing spin tokens count in new draws?**
A: Yes, if `includeSpinTokensInDraw` is `true`, all existing spin tokens automatically count.

**Q: Can I change settings between draws?**
A: Yes, settings apply immediately to new draws. Past draws unaffected.

**Q: What if weight multiplier is 0?**
A: Spin tokens ignored (same as disabled). Set to `0.1` minimum for inclusion.

**Q: Can users have both purchased and spin tokens counted?**
A: Yes, the system counts all tokens a user has from both sources.

**Q: How does notification differ for spin token winners?**
A: Notification includes "using spin wheel tokens" to explain the win source.

---

## Support
For issues or questions about draw settings, contact the development team or check logs at:
```
Backend: src/controllers/adminController.ts - triggerDraw function
Models: src/models/Settings.ts
Routes: src/routes/admin.ts - PUT /settings
```

**Created:** 2026-05-11
**Version:** 1.0
