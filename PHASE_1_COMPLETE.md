# PHASE 1: MongoDB Infrastructure Setup - COMPLETE ✅

## What Was Created

### 1. New Database Package (`lib/db-mongoose`)
```
lib/db-mongoose/
├── src/
│   ├── models/
│   │   ├── User.ts              (13 fields, 4 indexes)
│   │   ├── Token.ts             (7 fields, 4 indexes, UNIQUE tokenNumber)
│   │   ├── Transaction.ts       (9 fields, 4 indexes)
│   │   ├── Draw.ts              (8 fields, 2 indexes)
│   │   ├── DrawParticipation.ts (15 fields, 4 indexes)
│   │   ├── Referral.ts          (4 fields, 2 indexes)
│   │   ├── Notification.ts      (6 fields, 3 indexes)
│   │   ├── Settings.ts          (16 fields, singleton)
│   │   ├── Upload.ts            (6 fields, 3 indexes)
│   │   ├── SpinHistory.ts       (4 fields, 2 indexes)
│   │   ├── PageContent.ts       (7 fields, no indexes)
│   │   ├── ContactMessage.ts    (6 fields, 2 indexes)
│   │   ├── TokenCounter.ts      (counter for sequential tokenNumber)
│   │   └── index.ts             (all exports)
│   ├── utils.ts                 (helper functions for DB operations)
│   ├── seed.ts                  (initialize defaults)
│   └── index.ts                 (connection initialization)
├── package.json                 (mongoose dependency)
├── tsconfig.json
├── README.md                    (full documentation)
├── SCHEMA_MIGRATION.md          (PostgreSQL → MongoDB mapping)
└── .gitkeep

```

### 2. Environment Configuration
- **`.env`** - MongoDB connection credentials + JWT secret
- **`.env.example`** - Template for all required variables

### 3. TypeScript Interfaces
- Full TypeScript support with interfaces for all 12 models
- Mongoose schema validation
- Type-safe database operations

### 4. Connection Initialization
- `connectDB()` - Establish MongoDB connection
- `disconnectDB()` - Graceful shutdown
- Error handling with connection retries

### 5. Utility Functions
- `generateTokensForTransaction()` - Bulk create tokens
- `getUserByIdentifier()` - Find by email or phone
- `getUserById()` - Quick user lookup
- `updateUserTokens()` - Increment/decrement balance
- `markTokensAsUsed()` - Link tokens to draw
- `getAvailableTokensForUser()` - List user's free tokens
- `getRandomWinningToken()` - Winner selection
- `getNextTokenNumber()` - Sequential token numbering

### 6. Seed Script
- Initialize default Settings
- Create TokenCounter starting at 1000
- Safe for re-running (checks for existing data)

---

## MongoDB Atlas Details

**Cluster**: `cluster0`  
**Host**: `cluster0.jh7mffz.mongodb.net`  
**Database**: `kaptan-lucky-draw`  
**Username**: `kaptanluckydraw_db_user`  
**Password**: `TpOqQ55tocgi4tla` (stored in `.env`)

### Connection Features
- ✅ Retries enabled (`retryWrites=true`)
- ✅ Write majority acknowledgment (`w=majority`)
- ✅ DNS seed list (SRV record, `mongodb+srv://`)
- ✅ TLS/SSL encrypted

---

## Key Differences: PostgreSQL → MongoDB

| Aspect | PostgreSQL | MongoDB |
|--------|-----------|---------|
| **Package** | `drizzle-orm` + `pg` | `mongoose` |
| **Connection** | `DATABASE_URL` (PostgreSQL string) | `MONGODB_URI` (MongoDB Atlas string) |
| **ID Type** | `SERIAL` (auto-increment int) | `ObjectId` (12-byte hex) |
| **Relationships** | Foreign keys (enforced) | Mongoose refs (optional) |
| **Transactions** | Native (multi-row ACID) | Supported (v4.0+, multi-doc) |
| **Indexes** | Drizzle DSL | Mongoose schema indexes |
| **Sequences** | SERIAL type | TokenCounter collection |
| **JSON Fields** | `json` type | Native BSON documents |
| **Queries** | Drizzle builder | Mongoose methods (find, findById, etc.) |
| **Types** | Drizzle $inferSelect | Mongoose interfaces |

---

## Critical: TokenCounter for Sequential IDs

PostgreSQL used `SERIAL` for auto-incrementing IDs:
```sql
tokenNumber SERIAL UNIQUE
```

MongoDB doesn't have auto-increment sequences. Instead, we use a counter collection:

```typescript
// MongoDB approach:
export async function getNextTokenNumber(): Promise<number> {
  const counter = await TokenCounter.findByIdAndUpdate(
    "tokenNumber",
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return counter.value;
}
```

This ensures sequential token numbers (1001, 1002, 1003...) needed for the Lucky Draw system.

---

## Next: Phase 2 Preparation

### What Phase 2 Will Do
Migrate the **API Server** (`artifacts/api-server`) to use Mongoose instead of Drizzle:

1. **Update dependencies**
   - Replace `drizzle-orm`, `pg` with Mongoose
   - Remove Drizzle config

2. **Update connection initialization**
   - Import `connectDB` from `@workspace/db-mongoose`
   - Call it before starting Express server

3. **Migrate routes one by one**
   - Replace Drizzle queries with Mongoose
   - Maintain identical API response format
   - Update each route file (auth, user, admin, spin, etc.)

4. **Test each endpoint**
   - Smoke test after each route migration
   - Verify responses match current format
   - No frontend changes needed

### Files That Need Updating in Phase 2

**Core API Server Files**:
```
artifacts/api-server/
├── package.json                (remove drizzle, add mongoose)
├── src/
│   ├── index.ts                (call connectDB())
│   ├── app.ts                  (no changes)
│   ├── lib/
│   │   └── auth.ts             (import from @workspace/db-mongoose)
│   └── routes/
│       ├── auth.ts             (MIGRATE: register, login)
│       ├── user.ts             (MIGRATE: profile, tokens, transactions, etc.)
│       ├── admin.ts            (MIGRATE: user mgmt, draws, transactions)
│       ├── spin.ts             (MIGRATE: spin logic)
│       ├── upload.ts           (DB tracking already minimal)
│       ├── public.ts           (MIGRATE: public endpoints)
│       ├── pages.ts            (MIGRATE: dynamic pages)
│       ├── contact.ts          (MIGRATE: contact form)
│       └── health.ts           (no DB calls)
├── tsconfig.json               (no changes)
└── build.mjs                   (no changes)
```

**Old Drizzle Files** (to be removed):
```
lib/db/                         (entire folder, replaced by lib/db-mongoose)
lib/api-zod/                    (keep for now, used by api-client)
```

---

## Testing the Setup

### 1. Verify Connection
```bash
cd artifacts/api-server
npm run build   # Should compile without errors
NODE_ENV=development npm run dev
# Logs should show: "✓ Connected to MongoDB"
```

### 2. Check Models
```typescript
import { User, Token, Draw } from "@workspace/db-mongoose";

// All models are ready
const users = await User.find().limit(5);
const tokens = await Token.findOne({ status: "available" });
```

### 3. Run Seed
```bash
node --loader ts-node/esm lib/db-mongoose/src/seed.ts
# Logs: "✓ Settings initialized", "✓ Token counter initialized"
```

---

## Important Notes

⚠️ **Do NOT modify**:
- Frontend (client/) - NO CHANGES
- API response format - KEEP IDENTICAL
- JWT auth flow - KEEP IDENTICAL
- Environment variable names (except DATABASE_URL → MONGODB_URI)

✅ **DO modify**:
- Backend imports (Drizzle → Mongoose)
- Route queries (Drizzle DSL → Mongoose methods)
- API server dependencies
- Connection initialization

✅ **MongoDB advantages over PostgreSQL**:
- Flexible schema (no migrations needed for new fields)
- Better scalability for document-oriented data
- Native nested documents (no JSON column complexity)
- Built-in TTL indexes (for session management)
- Sharding support (no code changes needed)
- Aggregation pipeline (advanced analytics)

---

## Ready for Phase 2?

Before proceeding to Phase 2 (Auth Routes Migration), ensure:

- [ ] `.env` file created with `MONGODB_URI`
- [ ] pnpm install (Mongoose dependency added)
- [ ] No build errors in `lib/db-mongoose`
- [ ] Seed script runs successfully
- [ ] Connection to MongoDB Atlas confirmed

**Start Phase 2 when ready!** 🚀
