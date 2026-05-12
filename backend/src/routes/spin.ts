import { Router } from "express";
import {
  User,
  SpinHistory,
  Notification,
  Transaction,
  Token,
  Draw,
  DrawParticipation,
} from "../lib/db-mongoose/index.js";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import { randomInt } from "crypto";

const router = Router();
router.use(requireAuth as any);

// 30% win chance (3 out of 8 slices), 70% "Better Luck"
const SLICE_REWARDS: Record<number, number> = {
  0: 0,  // Better Luck
  1: 4,  // 4 tokens (WIN)
  2: 0,  // Better Luck
  3: 0,  // Better Luck
  4: 5,  // 5 tokens (WIN)
  5: 0,  // Better Luck
  6: 3,  // 3 tokens (WIN)
  7: 0,  // Better Luck
};

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC+5

function getTodayPKT(): string {
  return new Date(Date.now() + PKT_OFFSET_MS).toISOString().slice(0, 10);
}

function getMidnightPKTTimestamp(): number {
  const pktNow = new Date(Date.now() + PKT_OFFSET_MS);
  const nextMidnightPKT = new Date(Date.UTC(
    pktNow.getUTCFullYear(),
    pktNow.getUTCMonth(),
    pktNow.getUTCDate() + 1,
  ));
  return nextMidnightPKT.getTime() - PKT_OFFSET_MS;
}

async function getSpinEligibility(userId: string): Promise<{ isEligible: boolean; totalTokensPurchased: number }> {
  const user = await User.findById(userId).select("spinForceEnabled");

  const [purchaseRow] = await Transaction.aggregate([
    { $match: { userId, status: "approved" } },
    { $group: { _id: null, totalTokensPurchased: { $sum: "$tokensCount" } } },
  ]) || [{ totalTokensPurchased: 0 }];

  const totalTokensPurchased = purchaseRow?.totalTokensPurchased ?? 0;
  const isEligible = Boolean(user?.spinForceEnabled) || totalTokensPurchased >= 100;
  return { isEligible, totalTokensPurchased };
}

router.get("/status", async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId!).select(
      "lastSpinDate spinForceEnabled"
    );

    const [purchaseRow] = await Transaction.aggregate([
      { $match: { userId: req.userId!, status: "approved" } },
      { $group: { _id: null, totalTokensPurchased: { $sum: "$tokensCount" } } },
    ]) || [{ totalTokensPurchased: 0 }];

    const totalTokensPurchased = purchaseRow?.totalTokensPurchased ?? 0;
    const isEligible = Boolean(user?.spinForceEnabled) || totalTokensPurchased >= 100;

    const today = getTodayPKT();
    const alreadySpun = user?.lastSpinDate?.toISOString().slice(0, 10) === today;
    const nextSpinAt = getMidnightPKTTimestamp();
    const secondsUntilNextSpin = alreadySpun
      ? Math.ceil((nextSpinAt - Date.now()) / 1000)
      : 0;

    res.json({
      isEligible,
      totalTokensPurchased,
      canSpin: isEligible && !alreadySpun,
      nextSpinAt: alreadySpun ? new Date(nextSpinAt).toISOString() : null,
      secondsUntilNextSpin: alreadySpun ? secondsUntilNextSpin : 0,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch spin status" });
  }
});

router.post("/", async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId!).select(
      "tokens lastSpinDate spinForceEnabled"
    );

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check purchase eligibility
    const { isEligible, totalTokensPurchased } = await getSpinEligibility(
      req.userId!
    );
    if (!isEligible) {
      res.status(403).json({
        error:
          "You need to purchase at least 100 tokens to unlock daily spins",
        totalTokensPurchased,
      });
      return;
    }

    const today = getTodayPKT();
    if (user.lastSpinDate?.toISOString().slice(0, 10) === today) {
      const nextSpinAt = getMidnightPKTTimestamp();
      res.status(429).json({
        error: "You have already spun today. Come back tomorrow!",
        nextSpinAt: new Date(nextSpinAt).toISOString(),
        secondsUntilNextSpin: Math.ceil((nextSpinAt - Date.now()) / 1000),
      });
      return;
    }

    const resultIndex = Math.floor(Math.random() * 8);
    const tokensWon = SLICE_REWARDS[resultIndex] ?? 0;

    // Create real token entries if user won
    let createdTokenIds: string[] = [];
    let assignedDrawId: string | null = null;
    let assignedDrawName: string | null = null;

    if (tokensWon > 0) {
      // Generate unique token numbers for this win
      const tokenNumbers: number[] = [];
      while (tokenNumbers.length < tokensWon) {
        const num = randomInt(100000, 999999);
        const existing = await Token.findOne({ tokenNumber: num });
        if (!existing) {
          tokenNumbers.push(num);
        }
      }

      console.log(`Spin: Creating ${tokensWon} tokens for user ${req.userId}`, tokenNumbers);

      // Try to find a draw the user has participated in
      let participation = await DrawParticipation.findOne({ 
        userId: req.userId! 
      }).populate("drawId");

      // If user hasn't participated in any draws, find any active draw
      if (!participation || !participation.drawId) {
        const activeDraw = await Draw.findOne({ status: "active" }).select("_id name");
        if (activeDraw) {
          assignedDrawId = activeDraw._id.toString();
          assignedDrawName = activeDraw.name;
          console.log(`Spin: Assigned to active draw: ${assignedDrawName}`);
        } else {
          console.log(`Spin: No active draws found, tokens will be unassigned`);
        }
      } else {
        assignedDrawId = (participation.drawId as any)._id.toString();
        assignedDrawName = (participation.drawId as any).name;
        console.log(`Spin: Assigned to user's draw: ${assignedDrawName}`);
      }

      // Create token entries linked to the draw (or without draw if none available)
      const tokenEntries = tokenNumbers.map(num => {
        const entry: any = {
          userId: req.userId!,
          tokenNumber: num,
          status: "available" as const,
          spinWon: true,
        };
        if (assignedDrawId) {
          // Keep drawId as is - Mongoose will handle the conversion
          entry.drawId = assignedDrawId;
        }
        return entry;
      });

      try {
        const createdTokens = await Token.insertMany(tokenEntries);
        createdTokenIds = createdTokens.map(t => t._id.toString());
        console.log(`Spin: Successfully created ${createdTokenIds.length} tokens`);
      } catch (err) {
        console.error(`Spin: Failed to create tokens:`, err);
        throw err;
      }
    }

    // Update user balance
    const newUserRecord = await User.findByIdAndUpdate(
      req.userId!,
      {
        $inc: { tokens: tokensWon },
        lastSpinDate: new Date(),
      },
      { new: true }
    );

    // Record in spin history
    await SpinHistory.create({
      userId: req.userId!,
      resultIndex,
      tokensWon,
      createdAt: new Date(),
    });

    // Create notification
    if (tokensWon > 0) {
      const drawMessage = assignedDrawName 
        ? `They have been assigned to the "${assignedDrawName}" draw.`
        : "Use them in any active draw!";
      
      await Notification.create({
        userId: req.userId!,
        type: "win",
        title: `Daily Spin Reward — ${tokensWon} Token${
          tokensWon > 1 ? "s" : ""
        } Won!`,
        message: `Congratulations! You won ${tokensWon} real token${
          tokensWon > 1 ? "s" : ""
        } from the daily spin wheel. ${drawMessage}`,
      });
    } else {
      await Notification.create({
        userId: req.userId!,
        type: "info",
        title: "Better Luck Next Time!",
        message: "You didn't win tokens today, but you can try again tomorrow!",
      });
    }

    const nextSpinAt = getMidnightPKTTimestamp();

    res.json({
      resultIndex,
      tokensWon,
      newTotal: (newUserRecord?.tokens ?? 0),
      nextSpinAt: new Date(nextSpinAt).toISOString(),
      secondsUntilNextSpin: Math.ceil((nextSpinAt - Date.now()) / 1000),
      tokenIds: createdTokenIds,
    });
  } catch (err) {
    console.error("Spin error:", err);
    res.status(500).json({ error: "Spin failed. Please try again." });
  }
});

export default router;
