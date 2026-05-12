import { randomInt } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { type Response } from "express";
import {
  User,
  Transaction,
  DrawParticipation,
  Referral,
  Notification,
  SpinHistory,
  Draw,
  Settings,
  Upload,
  ContactMessage,
  Token,
} from "../lib/db-mongoose/index.js";
import { type AuthRequest } from "../lib/auth.js";

const __dirnameAdmin = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirnameAdmin, "..", "..", "uploads");
const STORAGE_LIMIT_MB = 500;

// ── HELPERS ───────────────────────────────────────────────────────────────────

async function getSettingsFromDB() {
  let settings = await Settings.findOne({});
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

function todayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

async function generateUniqueReferralCode(
  userId: string,
  name: string | null
): Promise<string> {
  const base =
    (name || `USER${userId}`)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8) || `USER${userId}`;
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Math.random()
      .toString(36)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4)
      .padEnd(4, "X");
    const code = `${base}-${suffix}`;
    const existing = await User.findOne({ referralCode: code });
    if (!existing) return code;
  }
  return `${base}-${userId}`;
}

async function maybeAssignReferralCode(userId: string): Promise<string | null> {
  const user = await User.findById(userId);
  if (!user) return null;
  if (user.referralCode) return user.referralCode;

  const [purchaseResult] = await Transaction.aggregate([
    { $match: { userId, status: "approved" } },
    { $group: { _id: null, totalPurchased: { $sum: "$tokensCount" } } },
  ]);
  const totalPurchased = purchaseResult?.totalPurchased ?? 0;
  if (!user.referralForceEnabled && totalPurchased < 100) return null;

  const code = await generateUniqueReferralCode(userId, user.name ?? null);
  await User.findByIdAndUpdate(userId, { referralCode: code });
  return code;
}

async function allocateUniqueTokenNumbers(count: number): Promise<number[]> {
  const tokenNumbers = new Set<number>();

  while (tokenNumbers.size < count) {
    const batchSize = Math.min(50, count * 2);
    const batch = new Set<number>();
    while (batch.size < batchSize) {
      batch.add(randomInt(100000, 999999));
    }

    const candidates = Array.from(batch).filter((value) => !tokenNumbers.has(value));
    if (candidates.length === 0) continue;

    const existing = await Token.find({ tokenNumber: { $in: candidates } })
      .select("tokenNumber")
      .lean();
    const existingSet = new Set(existing.map((t) => t.tokenNumber));

    for (const value of candidates) {
      if (tokenNumbers.size >= count) break;
      if (!existingSet.has(value)) {
        tokenNumbers.add(value);
      }
    }
  }

  return Array.from(tokenNumbers).slice(0, count);
}

async function generateTokensForTransaction(
  userId: string,
  transactionId: string,
  count: number
): Promise<void> {
  if (count <= 0) return;
  const tokenNumbers = await allocateUniqueTokenNumbers(count);
  const values = tokenNumbers.map((number) => ({
    userId,
    transactionId,
    tokenNumber: number,
    status: "available" as const,
  }));
  await Token.insertMany(values);
}

async function syncUserTokenState(userId: string) {
  const [availableTokens, totalTokens] = await Promise.all([
    Token.countDocuments({ userId, status: "available" }),
    Token.countDocuments({ userId }),
  ]);

  await User.findByIdAndUpdate(userId, { $set: { tokens: availableTokens } });

  if (totalTokens === 0) {
    await DrawParticipation.deleteMany({ userId });
  }
}

// ── STATS ─────────────────────────────────────────────────────────────────────

export async function getStats(_req: AuthRequest, res: Response) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsersResult] = (await User.aggregate([
      { $group: { _id: null, count: { $sum: 1 } } },
    ])) || [{ count: 0 }];
    const totalUsers = totalUsersResult?.count ?? 0;

    const newToday = await User.countDocuments({ createdAt: { $gte: today } });
    const activeDraws = await Draw.countDocuments({ status: "active" });

    const [tokensTodayResult] = (await Transaction.aggregate([
      {
        $match: { status: "approved", createdAt: { $gte: today } },
      },
      { $group: { _id: null, total: { $sum: "$tokensCount" } } },
    ])) || [{ total: 0 }];
    const tokensSoldToday = tokensTodayResult?.total ?? 0;

    const pendingCount = await Transaction.countDocuments({ status: "pending" });

    const [totalRevenueResult] = (await Transaction.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amountPkr" } } },
    ])) || [{ total: 0 }];
    const totalRevenue = totalRevenueResult?.total ?? 0;

    const spinsTodayCount = await SpinHistory.countDocuments({
      createdAt: { $gte: today },
    });
    const totalWinners = await DrawParticipation.countDocuments({
      result: "won",
    });
    const totalReferrals = await Referral.countDocuments();
    const activeUsers = await User.countDocuments({ suspended: false });
    const totalAdmins = await User.countDocuments({ isAdmin: true });

    res.json({
      totalUsers,
      newUsersToday: newToday,
      activeDraws,
      tokensSoldToday,
      pendingTransactions: pendingCount,
      pendingPayments: pendingCount,
      totalRevenuePkr: totalRevenue,
      totalRevenue,
      totalSpinsToday: spinsTodayCount,
      totalWinners,
      totalReferrals,
      activeUsers,
      totalAdmins,
      recentActivity: [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Stats failed" });
  }
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────

export async function getAnalytics(_req: AuthRequest, res: Response) {
  try {
    const last30 = new Date(Date.now() - 30 * 86400000);
    const last7 = new Date(Date.now() - 7 * 86400000);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalRevResult] = (await Transaction.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amountPkr" } } },
    ])) || [{ total: 0 }];
    const totalRev = totalRevResult?.total ?? 0;

    const [monthRevResult] = (await Transaction.aggregate([
      { $match: { status: "approved", createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$amountPkr" } } },
    ])) || [{ total: 0 }];
    const monthRev = monthRevResult?.total ?? 0;

    const [lastMonthRevResult] = (await Transaction.aggregate([
      {
        $match: {
          status: "approved",
          createdAt: { $gte: lastMonthStart, $lt: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountPkr" } } },
    ])) || [{ total: 0 }];
    const lastMonthRev = lastMonthRevResult?.total ?? 0;

    const [totalUsersResult] = (await User.aggregate([
      { $group: { _id: null, count: { $sum: 1 } } },
    ])) || [{ count: 0 }];
    const totalUsers = totalUsersResult?.count ?? 0;

    const newLast30 = await User.countDocuments({ createdAt: { $gte: last30 } });
    const newLast7 = await User.countDocuments({ createdAt: { $gte: last7 } });

    const [totalTokensIssuedResult] = (await Transaction.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$tokensCount" } } },
    ])) || [{ total: 0 }];
    const totalTokensIssued = totalTokensIssuedResult?.total ?? 0;

    const [totalTokensSpunResult] = (await SpinHistory.aggregate([
      { $group: { _id: null, total: { $sum: "$tokensWon" } } },
    ])) || [{ total: 0 }];
    const totalTokensSpun = totalTokensSpunResult?.total ?? 0;

    const [totalDrawsResult] = (await Draw.aggregate([
      { $group: { _id: null, count: { $sum: 1 } } },
    ])) || [{ count: 0 }];
    const totalDraws = totalDrawsResult?.count ?? 0;

    const completedDraws = await Draw.countDocuments({ status: "drawn" });

    const [totalPartsResult] = (await DrawParticipation.aggregate([
      { $group: { _id: null, count: { $sum: 1 } } },
    ])) || [{ count: 0 }];
    const totalParts = totalPartsResult?.count ?? 0;

    const [pendingTxResult] = (await Transaction.aggregate([
      { $match: { status: "pending" } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: { $sum: "$amountPkr" },
        },
      },
    ])) || [{ count: 0, amount: 0 }];
    const pendingTx = {
      count: pendingTxResult?.count ?? 0,
      amount: pendingTxResult?.amount ?? 0,
    };

    const rejectedTx = await Transaction.countDocuments({ status: "rejected" });
    const approvedTx = await Transaction.countDocuments({ status: "approved" });

    const suspendedUsers = await User.countDocuments({ suspended: true });
    const adminUsers = await User.countDocuments({ isAdmin: true });

    const totalReferrals = await Referral.countDocuments();

    const [totalSpinsResult] = (await SpinHistory.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          tokensAwarded: { $sum: "$tokensWon" },
        },
      },
    ])) || [{ count: 0, tokensAwarded: 0 }];
    const totalSpins = {
      count: totalSpinsResult?.count ?? 0,
      tokensAwarded: totalSpinsResult?.tokensAwarded ?? 0,
    };

    const revenueByMethod = await Transaction.aggregate([
      { $match: { status: "approved" } },
      {
        $group: {
          _id: "$paymentMethod",
          total: { $sum: "$amountPkr" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const dailyUsers = await User.aggregate([
      { $match: { createdAt: { $gte: last30 } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const dailyRevenue = await Transaction.aggregate([
      {
        $match: {
          status: "approved",
          createdAt: { $gte: last30 },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          total: { $sum: "$amountPkr" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const topDraws = await DrawParticipation.aggregate([
      {
        $group: {
          _id: "$drawName",
          participants: { $addToSet: "$userId" },
          totalTokens: { $sum: "$tokensUsed" },
        },
      },
      { $sort: { participants: -1 } },
      { $limit: 5 },
      {
        $project: {
          drawName: "$_id",
          participants: { $size: "$participants" },
          totalTokens: 1,
          _id: 0,
        },
      },
    ]);

    const revGrowth =
      lastMonthRev > 0 ? Math.round(((monthRev - lastMonthRev) / lastMonthRev) * 100) : null;

    res.json({
      revenue: {
        total: totalRev,
        thisMonth: monthRev,
        lastMonth: lastMonthRev,
        growthPercent: revGrowth,
        byMethod: revenueByMethod.map((r) => ({
          method: r._id,
          total: r.total,
          count: r.count,
        })),
        dailyLast30: dailyRevenue.map((d) => ({
          date: d._id,
          total: d.total,
          count: d.count,
        })),
      },
      users: {
        total: totalUsers,
        newLast7Days: newLast7,
        newLast30Days: newLast30,
        suspended: suspendedUsers,
        admins: adminUsers,
        dailyLast30: dailyUsers.map((d) => ({
          date: d._id,
          count: d.count,
        })),
      },
      transactions: {
        pending: { count: pendingTx.count, valuesPkr: pendingTx.amount },
        approved: approvedTx,
        rejected: rejectedTx,
      },
      tokens: {
        issuedViaPayments: totalTokensIssued,
        awardedViaSpins: totalTokensSpun,
      },
      draws: {
        total: totalDraws,
        completed: completedDraws,
        totalParticipations: totalParts,
        topDraws,
      },
      referrals: { total: totalReferrals },
      spins: {
        total: totalSpins.count,
        tokensAwarded: totalSpins.tokensAwarded,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Analytics failed" });
  }
}

// ── USERS ─────────────────────────────────────────────────────────────────────

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const q = (req.query.q as string) || "";
    const sort = (req.query.sort as string) || "newest";

    let filter: Record<string, any> = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    let sortObj: Record<string, number> = { createdAt: -1 };
    if (sort === "most_tokens") {
      sortObj = { tokens: -1 };
    }

    const users = await User.find(filter)
      .select("_id name email phone city province tokens isAdmin suspended createdAt referralCode")
      .sort(sortObj as any)
      .skip(offset)
      .limit(limit);

    const total = await User.countDocuments(filter);

    const referralCounts = await Referral.aggregate([
      { $match: { referrerId: { $in: users.map((u) => u._id) } } },
      {
        $group: {
          _id: "$referrerId",
          count: { $sum: 1 },
        },
      },
    ]);

    const refCountMap = Object.fromEntries(referralCounts.map((r) => [r._id.toString(), r.count]));

    const enriched = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
      phone: u.phone,
      city: u.city,
      province: u.province,
      tokens: u.tokens,
      isAdmin: u.isAdmin,
      suspended: u.suspended,
      createdAt: u.createdAt,
      referralCode: u.referralCode,
      referralCount: refCountMap[u._id.toString()] ?? 0,
    }));

    res.json({ users: enriched, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function getUser(req: AuthRequest, res: Response) {
  try {
    const uid = req.params.id;
    const user = await User.findById(uid);
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const [transactions, participations, referrals, spins] = await Promise.all([
      Transaction.find({ userId: uid }).sort({ createdAt: -1 }).limit(50),
      DrawParticipation.find({ userId: uid }).sort({ joinedAt: -1 }).limit(50),
      Referral.find({ referrerId: uid }).sort({ createdAt: -1 }).limit(50),
      SpinHistory.find({ userId: uid }).sort({ createdAt: -1 }).limit(50),
    ]);

    const { passwordHash: _, ...safeUser } = user.toObject();

    const latestPaymentTx = await Transaction.findOne({
      userId: uid,
      paymentTransactionId: { $nin: [null, ""] },
    })
      .sort({ createdAt: -1 })
      .select("paymentTransactionId customerAddress")
      .lean();

    const displayAddress = safeUser.address || latestPaymentTx?.customerAddress || null;
    const lastPaymentTransactionId = latestPaymentTx?.paymentTransactionId || null;

    const [txStats] = (await Transaction.aggregate([
      { $match: { userId: uid } },
      {
        $group: {
          _id: null,
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, "$amountPkr", 0],
            },
          },
          totalTokensBought: {
            $sum: {
              $cond: [{ $eq: ["$status", "approved"] }, "$tokensCount", 0],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
        },
      },
    ])) || [{ totalSpent: 0, totalTokensBought: 0, pendingCount: 0 }];

    res.json({
      user: {
        ...safeUser,
        id: user._id.toString(),
        address: displayAddress,
        lastPaymentTransactionId,
      },
      stats: {
        totalSpentPkr: txStats?.totalSpent ?? 0,
        totalTokensBought: txStats?.totalTokensBought ?? 0,
        pendingTransactions: txStats?.pendingCount ?? 0,
        totalDrawsEntered: participations.length,
        winsCount: participations.filter((p) => p.result === "won").length,
        totalReferrals: referrals.length,
        totalSpins: spins.length,
        // ✨ NEW: Enhanced token breakdown
        tokensFromSpins: spins.reduce((s, sp) => s + (sp.tokensWon || 0), 0),
        currentTokenBalance: safeUser.tokens ?? 0,
        tokenSources: {
          purchasedTokens: txStats?.totalTokensBought ?? 0,
          spinWonTokens: spins.reduce((s, sp) => s + (sp.tokensWon || 0), 0),
          totalTokensInAccount: safeUser.tokens ?? 0,
        },
      },
      transactions,
      participations,
      referrals,
      spins,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function getUserTokens(req: AuthRequest, res: Response) {
  try {
    const uid = req.params.id;
    
    // Get all tokens (purchased and spin-won)
    const tokens = await Token.find({ userId: uid })
      .sort({ createdAt: -1 })
      .populate({
        path: "drawId",
        model: Draw,
        select: "name",
      })
      .populate({
        path: "transactionId",
        model: Transaction,
        select: "amountPkr tokensCount status createdAt",
      });

    // Separate purchased and spin-won tokens
    const purchasedTokens = tokens.filter(t => !t.spinWon).map((t) => ({
      id: t._id.toString(),
      tokenNumber: t.tokenNumber,
      type: "purchased",
      source: "transaction",
      drawId: t.drawId?._id.toString() ?? null,
      drawName: (t.drawId as any)?.name ?? null,
      status: t.status,
      createdAt: t.createdAt,
      transactionId: t.transactionId?._id.toString() ?? null,
      transactionAmount: (t.transactionId as any)?.amountPkr ?? null,
      transactionTokensCount: (t.transactionId as any)?.tokensCount ?? null,
      transactionStatus: (t.transactionId as any)?.status ?? null,
      transactionCreatedAt: (t.transactionId as any)?.createdAt ?? null,
    }));

    const spinTokens = tokens.filter(t => t.spinWon).map((t) => ({
      id: t._id.toString(),
      tokenNumber: t.tokenNumber,
      type: "spin",
      source: "daily_spin",
      drawId: t.drawId?._id.toString() ?? null,
      drawName: (t.drawId as any)?.name ?? null,
      status: t.status,
      createdAt: t.createdAt,
    }));

    // Get spin history for additional context
    const spinHistory = await SpinHistory.find({ userId: uid })
      .sort({ createdAt: -1 });

    const spinHistoryMapped = spinHistory.map((s) => ({
      id: s._id.toString(),
      type: "spin_history",
      tokensWon: s.tokensWon,
      resultIndex: s.resultIndex,
      createdAt: s.createdAt,
    }));

    // Combine all for display
    const allTokens = [...purchasedTokens, ...spinTokens].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const summary = {
      totalPurchasedTokens: purchasedTokens.length,
      totalSpinTokens: spinTokens.length,
      totalTokens: tokens.length,
      purchasedTokensList: purchasedTokens,
      spinTokensList: spinTokens,
      spinHistory: spinHistoryMapped,
      allTokensCombined: allTokens,
    };

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function deleteUserToken(req: AuthRequest, res: Response) {
  try {
    const uid = String(req.params.id || "").trim();
    const tokenId = String(req.params.tokenId || "").trim();

    const token = await Token.findOne({ _id: tokenId, userId: uid }).select("status");
    if (!token) {
      res.status(404).json({ error: "Token not found" });
      return;
    }

    const result = await Token.deleteOne({ _id: tokenId, userId: uid });
    if (result.deletedCount === 0) {
      res.status(404).json({ error: "Token not found" });
      return;
    }

    await syncUserTokenState(uid);

    const updatedUser = await User.findById(uid).select("tokens");
    res.json({ ok: true, deletedCount: result.deletedCount ?? 0, tokens: updatedUser?.tokens ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete token" });
  }
}

export async function deleteUserTokens(req: AuthRequest, res: Response) {
  try {
    const uid = String(req.params.id || "").trim();
    const payload = req.body as { status?: string };
    const queryStatus = typeof req.query.status === "string" ? req.query.status : undefined;
    const drawId = typeof req.query.drawId === "string" ? req.query.drawId : undefined;
    const status = payload?.status ?? queryStatus;
    const allowed = ["used", "available", "all"];
    if (status && !allowed.includes(status)) {
      res.status(400).json({ error: "Invalid status filter" });
      return;
    }

    const filter: Record<string, unknown> = { userId: uid };
    if (status === "used") filter.status = "used";
    else if (status === "available") filter.status = "available";
    if (drawId) filter.drawId = drawId;

    // Delete ALL tokens matching the filter
    const result = await Token.deleteMany(filter);

    await syncUserTokenState(uid);

    const updatedUser = await User.findById(uid).select("tokens");
    res.json({ ok: true, deletedCount: result.deletedCount ?? 0, tokens: updatedUser?.tokens ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete tokens" });
  }
}

export async function adjustUserTokens(req: AuthRequest, res: Response) {
  try {
    const uid = req.params.id;
    const { delta, reason } = req.body as { delta: number; reason: string };
    if (!delta || isNaN(delta)) {
      res.status(400).json({ error: "delta required" });
      return;
    }

    const user = await User.findByIdAndUpdate(uid, { $inc: { tokens: delta } }, { new: true });

    await Notification.create({
      userId: uid,
      type: "payment",
      title: delta > 0 ? `${delta} Tokens Added` : `${Math.abs(delta)} Tokens Deducted`,
      message:
        reason || (delta > 0 ? `${delta} tokens credited.` : `${Math.abs(delta)} tokens deducted.`),
    });

    res.json({ ok: true, newTokens: user?.tokens ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function suspendUser(req: AuthRequest, res: Response) {
  try {
    await User.findByIdAndUpdate(req.params.id, {
      suspended: req.body.suspended,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function setUserFlags(req: AuthRequest, res: Response) {
  try {
    const { referralForceEnabled, spinForceEnabled } = req.body as {
      referralForceEnabled?: boolean;
      spinForceEnabled?: boolean;
    };
    const updates: Record<string, any> = {};
    if (referralForceEnabled !== undefined) updates.referralForceEnabled = referralForceEnabled;
    if (spinForceEnabled !== undefined) updates.spinForceEnabled = spinForceEnabled;

    await User.findByIdAndUpdate(req.params.id, updates);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function notifyUser(req: AuthRequest, res: Response) {
  try {
    const { title, message, type } = req.body as {
      title: string;
      message: string;
      type?: string;
    };
    await Notification.create({
      userId: req.params.id,
      title,
      message,
      type: type || "info",
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

// ── DRAWS ─────────────────────────────────────────────────────────────────────

export async function listDraws(_req: AuthRequest, res: Response) {
  try {
    const draws = await Draw.find().sort({ createdAt: -1 });
    if (draws.length === 0) {
      res.json([]);
      return;
    }

    const drawIds = draws.map((d) => d._id);
    const tokensSoldAgg = await DrawParticipation.aggregate([
      { $match: { drawId: { $in: drawIds } } },
      {
        $group: {
          _id: "$drawId",
          total: { $sum: "$tokensUsed" },
          count: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          _id: 1,
          total: 1,
          count: { $size: "$count" },
        },
      },
    ]);

    const map = Object.fromEntries(
      tokensSoldAgg.map((r) => [
        r._id.toString(),
        { total: r.total, count: r.count },
      ])
    );

    res.json(
      draws.map((d) => ({
        id: d._id.toString(),
        ...d.toObject(),
        tokensSold: map[d._id.toString()]?.total ?? 0,
        participantCount: map[d._id.toString()]?.count ?? 0,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function createDraw(req: AuthRequest, res: Response) {
  try {
    const body = req.body;
    const draw = await Draw.create({
      name: body.name,
      category: body.category,
      prize: body.prize ?? body.name,
      prizeValuePkr: Number(body.prizeValuePkr),
      tokenPricePkr: Number(body.tokenPricePkr),
      tokenLimit: Number(body.tokenLimit) || 999999,
      imageUrl: body.imageUrl || null,
      status: body.status || "draft",
      badges: body.badges || null,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
    });
    res.json({
      id: draw._id.toString(),
      ...draw.toObject(),
      tokensSold: 0,
      participantCount: 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create draw" });
  }
}

export async function updateDraw(req: AuthRequest, res: Response) {
  try {
    const body = req.body;
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.category !== undefined) updates.category = body.category;
    if (body.prize !== undefined) updates.prize = body.prize;
    if (body.prizeValuePkr !== undefined) updates.prizeValuePkr = Number(body.prizeValuePkr);
    if (body.tokenPricePkr !== undefined) updates.tokenPricePkr = Number(body.tokenPricePkr);
    if (body.tokenLimit !== undefined) updates.tokenLimit = Number(body.tokenLimit);
    if (body.imageUrl !== undefined) updates.imageUrl = body.imageUrl;
    if (body.status !== undefined) updates.status = body.status;
    if (body.badges !== undefined) updates.badges = body.badges;
    if (body.startsAt !== undefined) updates.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.endsAt !== undefined) updates.endsAt = body.endsAt ? new Date(body.endsAt) : null;

    const draw = await Draw.findByIdAndUpdate(req.params.id, updates, { new: true });

    const [tokensSoldRow] = (await DrawParticipation.aggregate([
      { $match: { drawId: draw?._id } },
      {
        $group: {
          _id: null,
          total: { $sum: "$tokensUsed" },
          count: { $addToSet: "$userId" },
        },
      },
      { $project: { total: 1, count: { $size: "$count" } } },
    ])) || [{ total: 0, count: 0 }];

    res.json({
      id: draw?._id.toString(),
      ...draw?.toObject(),
      tokensSold: tokensSoldRow?.total ?? 0,
      participantCount: tokensSoldRow?.count ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update draw" });
  }
}

export async function deleteDraw(req: AuthRequest, res: Response) {
  try {
    await Draw.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function deleteDrawParticipants(req: AuthRequest, res: Response) {
  try {
    const drawId = req.params.id;
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.every((id: unknown) => typeof id === "string" && id.length > 0)) {
      res.status(400).json({ error: "Invalid participant IDs" });
      return;
    }
    const result = await DrawParticipation.deleteMany({ _id: { $in: ids }, drawId });
    res.json({ ok: true, deletedCount: result.deletedCount ?? 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete participants" });
  }
}

export async function triggerDraw(req: AuthRequest, res: Response) {
  try {
    const drawId = String(req.params.id);
    const count = Math.max(1, Number(req.body.count) || 1);
    const triggeredAt = new Date();
    console.debug("[admin/trigger-draw]", { drawId, count });

    const draw = await Draw.findById(drawId);
    if (!draw) {
      res.status(404).json({ error: "Draw not found" });
      return;
    }
    if (draw.status === "drawn") {
      res.status(400).json({ error: "Draw already executed" });
      return;
    }

    // ✨ NEW: Get draw execution settings
    const settings = await getSettingsFromDB();
    const includeSpinTokens = settings.includeSpinTokensInDraw ?? true;
    const spinTokenWeight = settings.spinTokenWeightMultiplier ?? 1.0;
    const executionMode = settings.drawExecutionMode ?? "purchased_and_spin";

    const drawTokens = await Token.find({
      drawId,
      status: "used",
    }).select("_id userId tokenNumber");

    const parts = await DrawParticipation.find({
      drawId,
      status: "active",
    }).select("_id userId tokensUsed");

    const partUserIds = Array.from(new Set(parts.map((p) => p.userId.toString())));
    const liveUsers = partUserIds.length > 0
      ? await User.find({ _id: { $in: partUserIds } }).select("_id tokens")
      : [];
    const liveUserIds = new Set(
      liveUsers
        .filter((user) => (user.tokens ?? 0) > 0)
        .map((user) => user._id.toString())
    );
    const liveParts = parts.filter((p) => liveUserIds.has(p.userId.toString()));

    // ✨ NEW: Get spin-won tokens if enabled
    let spinWinnerMap: Record<string, number> = {};
    if (includeSpinTokens && executionMode !== "purchased_only") {
      const spinHistory = await SpinHistory.aggregate([
        { $match: { tokensWon: { $gt: 0 } } },
        { $group: { _id: "$userId", totalSpinTokens: { $sum: "$tokensWon" } } },
      ]);
      spinWinnerMap = Object.fromEntries(
        spinHistory.map((item) => [item._id.toString(), item.totalSpinTokens])
      );
      console.debug("[admin/trigger-draw] spin winners:", Object.keys(spinWinnerMap).length);
    }

    console.debug(
      "[admin/trigger-draw] drawTokens",
      drawTokens.length,
      "activeParticipations",
      liveParts.length,
      "spinWinners",
      Object.keys(spinWinnerMap).length
    );

    if (liveParts.length === 0 && drawTokens.length === 0 && Object.keys(spinWinnerMap).length === 0) {
      res.json({ ok: true, winner: null, winners: [] });
      return;
    }

    const pool: { userId: string; tokenSlot: number; tokenNumber?: number; isSpinToken?: boolean }[] = [];
    
    // Add purchased tokens
    if (drawTokens.length > 0) {
      drawTokens.forEach((t, i) => {
        pool.push({
          userId: t.userId.toString(),
          tokenSlot: i + 1,
          tokenNumber: t.tokenNumber,
          isSpinToken: false,
        });
      });
    } else {
      let slot = 0;
      for (const p of liveParts) {
        for (let i = 0; i < p.tokensUsed; i++) {
          pool.push({ userId: p.userId.toString(), tokenSlot: ++slot, isSpinToken: false });
        }
      }
    }

    // ✨ NEW: Add spin-won tokens to pool with weight multiplier
    if (includeSpinTokens && executionMode !== "purchased_only") {
      for (const [userId, spinTokenCount] of Object.entries(spinWinnerMap)) {
        const weightedCount = Math.ceil(spinTokenCount * spinTokenWeight);
        for (let i = 0; i < weightedCount; i++) {
          pool.push({
            userId,
            tokenSlot: pool.length + 1,
            isSpinToken: true,
          });
        }
      }
    }

    const pickUniqueWeightedWinners = (
      entries: Array<{ userId: string; tokenSlot: number; tokenNumber?: number; isSpinToken?: boolean }>,
      countToPick: number
    ) => {
      const grouped = new Map<
        string,
        { entries: Array<{ tokenSlot: number; tokenNumber?: number; isSpinToken?: boolean }>; weight: number }
      >();

      for (const entry of entries) {
        const group = grouped.get(entry.userId);
        if (group) {
          group.entries.push({ tokenSlot: entry.tokenSlot, tokenNumber: entry.tokenNumber, isSpinToken: entry.isSpinToken });
          group.weight += 1;
        } else {
          grouped.set(entry.userId, {
            entries: [{ tokenSlot: entry.tokenSlot, tokenNumber: entry.tokenNumber, isSpinToken: entry.isSpinToken }],
            weight: 1,
          });
        }
      }

      const winners: Array<{
        userId: string;
        tokenSlot: number;
        totalSlots: number;
        tokenNumber?: number;
        isSpinToken?: boolean;
      }> = [];
      const maxWinners = Math.min(countToPick, grouped.size);
      const totalSlots = entries.length;

      for (let pick = 0; pick < maxWinners; pick++) {
        const groups = Array.from(grouped.entries());
        const totalWeight = groups.reduce((sum, [, group]) => sum + group.weight, 0);
        if (totalWeight <= 0) break;

        let choice = randomInt(0, totalWeight);
        for (const [userId, group] of groups) {
          if (choice < group.weight) {
            const selected = group.entries[randomInt(0, group.entries.length)];
            winners.push({
              userId,
              tokenSlot: selected.tokenSlot,
              totalSlots,
              tokenNumber: selected.tokenNumber,
              isSpinToken: selected.isSpinToken,
            });
            grouped.delete(userId);
            break;
          }
          choice -= group.weight;
        }
      }

      return winners;
    };

    const winners = pickUniqueWeightedWinners(pool, count);

    const winnerUserIds = [...new Set(winners.map((w) => w.userId))];
    const winnerUsers = await User.find({
      _id: { $in: winnerUserIds },
    }).select("_id name phone city");
    const userMap = Object.fromEntries(winnerUsers.map((u) => [u._id.toString(), u]));

    const winnersResult: Array<{
      id: string | null;
      userId: string;
      userName: string | null;
      drawId: string;
      drawName: string;
      prize: string;
      city: string | null;
      tokensWon: number;
      tokenId: string;
      name: string | null;
      phone: string | null;
      tokenSlot: number;
      totalSlots: number;
      tokensUsed: number;
      winningTokenNumber: number | null;
      isSpinTokenWin?: boolean;
    }> = [];
    for (const w of winners) {
      const user = userMap[w.userId];
      let part: (typeof parts[number] | null) =
        parts.find((p) => p.userId.toString() === w.userId) ?? null;
      if (!part) {
        part = await DrawParticipation.findOne({ drawId, userId: w.userId }).select(
          "_id userId tokensUsed"
        );
      }
      const participation = part
        ? await DrawParticipation.findByIdAndUpdate(
            part._id,
            {
              result: "won",
              winningTokenNumber: w.tokenNumber ?? null,
              winningTokenSlot: w.tokenSlot,
            },
            { new: true }
          )
        : null;

      if (user) {
        // ✨ NEW: Enhanced notification with spin token info
        const tokenSourceText = w.isSpinToken 
          ? "using spin wheel tokens" 
          : "with purchased tokens";
        await Notification.create({
          userId: w.userId,
          type: "win",
          title: "Congratulations! You Won!",
          message: `You won the ${draw.name} draw ${tokenSourceText}. Prize: ${draw.prize}. Our team will contact you shortly.`,
        });
      }

      winnersResult.push({
        id: participation?._id?.toString() ?? null,
        userId: w.userId,
        userName: user?.name ?? null,
        drawId: drawId,
        drawName: draw.name,
        prize: draw.prize,
        city: user?.city ?? null,
        tokensWon: part?.tokensUsed ?? 1,
        tokenId: participation?._id.toString() ?? "",
        name: user?.name ?? null,
        phone: user?.phone ?? null,
        tokenSlot: w.tokenSlot,
        totalSlots: w.totalSlots,
        tokensUsed: part?.tokensUsed ?? 1,
        winningTokenNumber: w.tokenNumber ?? null,
        isSpinTokenWin: w.isSpinToken ?? false,
      });
    }

    await User.updateMany(
      { _id: { $in: winnerUserIds } },
      {
        $set: {
          isWinner: true,
          wonDrawId: draw._id,
          wonAt: triggeredAt,
        },
      }
    );

    await Draw.findByIdAndUpdate(drawId, {
      status: "drawn",
      winners: winnersResult.map((w) => ({
        userId: w.userId,
        name: w.userName ?? undefined,
        city: w.city ?? undefined,
        prize: w.prize,
        tokenSlot: w.tokenSlot,
        totalSlots: w.totalSlots,
        wonAt: triggeredAt,
      })),
    });

    await DrawParticipation.updateMany(
      {
        drawId,
        status: "active",
        result: null,
      },
      { result: "lost", status: "cancelled" }
    );

    await DrawParticipation.updateMany(
      {
        drawId,
        status: "active",
        result: "won",
      },
      { status: "cancelled" }
    );

    await Token.updateMany({ drawId }, { status: "used" });

    res.json({ ok: true, winner: winnersResult[0] ?? null, winners: winnersResult });
  } catch (err) {
    console.error("[admin/trigger-draw] Error", err);
    res.status(500).json({ error: "Failed to trigger draw" });
  }
}

export async function getDrawTokens(req: AuthRequest, res: Response) {
  try {
    const drawId = req.params.id;
    const drawTokens = await Token.find({ drawId })
      .populate({
        path: "userId",
        model: User,
        select: "name phone",
      })
      .sort({ tokenNumber: 1 });

    const total = drawTokens.length;
    res.json({
      total,
      tokens: drawTokens.map((t) => ({
        id: t._id.toString(),
        tokenNumber: t.tokenNumber,
        userId: t.userId,
        status: t.status,
        createdAt: t.createdAt,
        transactionId: t.transactionId,
        userName: (t.userId as any)?.name ?? null,
        userPhone: (t.userId as any)?.phone ?? null,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function getDrawParticipants(req: AuthRequest, res: Response) {
  try {
    const drawId = req.params.id;
    const parts = await DrawParticipation.find({ drawId })
      .populate({
        path: "userId",
        model: User,
        select: "name phone city",
      })
      .sort({ joinedAt: -1 });

    res.json(
      parts.map((p) => ({
        id: p._id.toString(),
        userId: p.userId,
        tokensUsed: p.tokensUsed,
        status: p.status,
        result: p.result,
        joinedAt: p.joinedAt,
        userName: (p.userId as any)?.name ?? null,
        userPhone: (p.userId as any)?.phone ?? null,
        userCity: (p.userId as any)?.city ?? null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

export async function listTransactions(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    let filter: Record<string, any> = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const txs = await Transaction.find(filter)
      .populate({
        path: "userId",
        model: User,
        select: "name email phone address",
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);

    const mapped = txs.map((t) => ({
      id: t._id.toString(),
      userId: t.userId,
      amountPkr: t.amountPkr,
      tokensCount: t.tokensCount,
      paymentMethod: t.paymentMethod,
      screenshotUrl: t.screenshotUrl,
      status: t.status,
      rejectionReason: t.rejectionReason,
      createdAt: t.createdAt,
      drawId: t.drawId,
      drawName: t.drawName,
      paymentTransactionId: t.paymentTransactionId ?? null,
      userName: t.customerName ?? (t.userId as any)?.name ?? null,
      userEmail: (t.userId as any)?.email ?? null,
      userPhone: t.customerPhone ?? (t.userId as any)?.phone ?? null,
      userAddress: t.customerAddress ?? (t.userId as any)?.address ?? null,
    }));

    res.json({ transactions: mapped, total, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function approveTransaction(req: AuthRequest, res: Response) {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const drawId = tx.drawId;
    await Transaction.findByIdAndUpdate(req.params.id, { status: "approved" });
    await User.findByIdAndUpdate(tx.userId, {
      $inc: { tokens: tx.tokensCount },
    });
    await generateTokensForTransaction(tx.userId.toString(), tx._id.toString(), tx.tokensCount);

    if (drawId && tx.drawName) {
      const existing = await DrawParticipation.findOne({
        userId: tx.userId,
        drawId,
        status: "active",
      });
      if (!existing) {
        await DrawParticipation.create({
          userId: tx.userId,
          drawId,
          drawName: tx.drawName,
          prize: tx.drawName,
          tokensUsed: tx.tokensCount,
          status: "active",
        });
      }
    }

    await Notification.create({
      userId: tx.userId,
      type: "payment",
      title: "Payment Approved!",
      message: `Your payment of Rs. ${tx.amountPkr} has been approved. ${tx.tokensCount} tokens have been added to your account.`,
    });

    const referralCode = await maybeAssignReferralCode(tx.userId.toString());
    if (referralCode) {
      await Notification.create({
        userId: tx.userId,
        type: "referral",
        title: "Referral System Unlocked!",
        message: `Congratulations! You've reached 100 tokens. Your referral code is: ${referralCode}. Share it to earn rewards!`,
      }).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function rejectTransaction(req: AuthRequest, res: Response) {
  try {
    const { reason } = req.body as { reason: string };
    const tx = await Transaction.findById(req.params.id);
    if (!tx) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await Transaction.findByIdAndUpdate(req.params.id, {
      status: "rejected",
      rejectionReason: reason,
    });
    await Notification.create({
      userId: tx.userId,
      type: "payment",
      title: "Payment Rejected",
      message: `Your payment submission was rejected. Reason: ${reason || "Please contact support."}`,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function deleteTransaction(req: AuthRequest, res: Response) {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) {
      res.status(400).json({ error: "Invalid transaction id" });
      return;
    }

    let deletedCount = 0;

    const byMongoId = await Transaction.deleteOne({ _id: id } as any);
    deletedCount += byMongoId.deletedCount || 0;

    if (deletedCount === 0) {
      const byPaymentTxnId = await Transaction.deleteOne({ paymentTransactionId: id });
      deletedCount += byPaymentTxnId.deletedCount || 0;
    }

    res.json({ ok: true, deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

// ── WINNERS ───────────────────────────────────────────────────────────────────

export async function listWinners(_req: AuthRequest, res: Response) {
  try {
    const winners = await DrawParticipation.find({ result: "won" })
      .populate({
        path: "userId",
        model: User,
        select: "name phone email city address cnic",
      })
      .sort({ joinedAt: -1 });

    res.json(
      winners.map((w) => ({
        id: w._id.toString(),
        userId: w.userId,
        drawId: w.drawId?.toString(),
        drawName: w.drawName,
        prize: w.prize,
        displayName: w.displayName ?? null,
        displayCity: w.displayCity ?? null,
        displayPrize: w.displayPrize ?? null,
        displayTokenLabel: w.displayTokenLabel ?? null,
        displayDateLabel: w.displayDateLabel ?? null,
        displayImageUrl: w.displayImageUrl ?? null,
        displayAvatarUrl: w.displayAvatarUrl ?? null,
        status: w.prizeDeliveryStatus,
        deliveredAt: w.deliveredAt,
        joinedAt: w.joinedAt,
        userName: (w.userId as any)?.name ?? null,
        userPhone: (w.userId as any)?.phone ?? null,
        userEmail: (w.userId as any)?.email ?? null,
        city: (w.userId as any)?.city ?? null,
        address: (w.userId as any)?.address ?? null,
        cnic: (w.userId as any)?.cnic ?? null,
        winningTokenNumber: w.winningTokenNumber ?? null,
        winningTokenSlot: w.winningTokenSlot ?? null,
        deliveryNotes: w.deliveryNotes,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function updateWinner(req: AuthRequest, res: Response) {
  try {
    const updates = req.body as {
      prize?: string | null;
      prizeDeliveryStatus?: "pending_contact" | "contacted" | "dispatched" | "delivered" | null;
      displayName?: string | null;
      displayCity?: string | null;
      displayPrize?: string | null;
      displayTokenLabel?: string | null;
      displayDateLabel?: string | null;
      displayImageUrl?: string | null;
      displayAvatarUrl?: string | null;
      notes?: string | null;
    };

    const winner = await DrawParticipation.findById(req.params.id);
    if (!winner) {
      res.status(404).json({ error: "Winner not found" });
      return;
    }

    if (updates.prize !== undefined) winner.prize = updates.prize ?? undefined;
    if (updates.displayName !== undefined) winner.displayName = updates.displayName ?? undefined;
    if (updates.displayCity !== undefined) winner.displayCity = updates.displayCity ?? undefined;
    if (updates.displayPrize !== undefined) winner.displayPrize = updates.displayPrize ?? undefined;
    if (updates.displayTokenLabel !== undefined) winner.displayTokenLabel = updates.displayTokenLabel ?? undefined;
    if (updates.displayDateLabel !== undefined) winner.displayDateLabel = updates.displayDateLabel ?? undefined;
    if (updates.displayImageUrl !== undefined) winner.displayImageUrl = updates.displayImageUrl ?? undefined;
    if (updates.displayAvatarUrl !== undefined) winner.displayAvatarUrl = updates.displayAvatarUrl ?? undefined;
    if (updates.notes !== undefined) winner.deliveryNotes = updates.notes ?? undefined;
    if (updates.prizeDeliveryStatus !== undefined) {
      winner.prizeDeliveryStatus = updates.prizeDeliveryStatus ?? "pending_contact";
      if (updates.prizeDeliveryStatus === "delivered") {
        winner.deliveredAt = new Date();
      }
    }

    await winner.save();

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function updateDelivery(req: AuthRequest, res: Response) {
  try {
    const { status, notes } = req.body as { status: string; notes?: string };
    const updates: Record<string, any> = {
      prizeDeliveryStatus: status,
    };
    if (notes !== undefined) updates.deliveryNotes = notes;
    if (status === "delivered") updates.deliveredAt = new Date();

    await DrawParticipation.findByIdAndUpdate(req.params.id, updates);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function deleteWinner(req: AuthRequest, res: Response) {
  try {
    const winner = await DrawParticipation.findById(req.params.id).select(
      "_id userId drawId winningTokenSlot result"
    );

    if (!winner) {
      res.status(404).json({ error: "Winner not found" });
      return;
    }

    await DrawParticipation.findByIdAndDelete(winner._id);

    const pullQuery: Record<string, unknown> = { userId: winner.userId };
    if (winner.winningTokenSlot != null) {
      pullQuery.tokenSlot = winner.winningTokenSlot;
    }

    await Draw.findByIdAndUpdate(winner.drawId, {
      $pull: {
        winners: pullQuery,
      },
    });

    const remainingWins = await DrawParticipation.countDocuments({
      userId: winner.userId,
      result: "won",
    });

    if (remainingWins === 0) {
      await User.findByIdAndUpdate(winner.userId, {
        isWinner: false,
        wonDrawId: null,
        wonAt: null,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

// ── REFERRALS ─────────────────────────────────────────────────────────────────

export async function listReferrals(_req: AuthRequest, res: Response) {
  try {
    const total = await Referral.countDocuments();
    const credited = await Referral.countDocuments({ rewardGiven: true });

    const referrals = await Referral.find()
      .populate("referrerId", "name phone")
      .populate("referredUserId", "name phone")
      .sort({ createdAt: -1 })
      .limit(200);

    const topReferrers = await Referral.aggregate([
      { $group: { _id: "$referrerId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const topReferrerIds = topReferrers.map((r) => r._id);
    const topReferrerUsers = await User.find({ _id: { $in: topReferrerIds } }, { name: 1, phone: 1 });
    const userMap = Object.fromEntries(topReferrerUsers.map((u) => [u._id.toString(), u]));

    const topReferrerWithNames = topReferrers.map((r) => ({
      referrerId: r._id.toString(),
      count: r.count,
      name: userMap[r._id.toString()]?.name ?? null,
    }));

    res.json({
      total,
      totalTokensCredited: credited * 5,
      topReferrers: topReferrerWithNames,
      referrals: referrals.map((r) => ({
        id: r._id.toString(),
        referrerId: r.referrerId?.toString(),
        referrerName: (r.referrerId as any)?.name ?? null,
        referrerPhone: (r.referrerId as any)?.phone ?? null,
        referredUserId: r.referredUserId?.toString(),
        referredName: (r.referredUserId as any)?.name ?? null,
        referredPhone: (r.referredUserId as any)?.phone ?? null,
        rewardGiven: r.rewardGiven,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function grantReferral(req: AuthRequest, res: Response) {
  try {
    const ref = await Referral.findById(req.params.id);
    if (!ref) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    await Referral.findByIdAndUpdate(req.params.id, { rewardGiven: true });
    await User.findByIdAndUpdate(ref.referrerId, { $inc: { tokens: 1 } });
    await Notification.create({
      userId: ref.referrerId,
      type: "referral",
      title: "Referral Reward!",
      message: "You earned 1 token for a successful referral!",
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function revokeReferral(req: AuthRequest, res: Response) {
  try {
    await Referral.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

// ── SETTINGS ──────────────────────────────────────────────────────────────────

export async function getSettings(_req: AuthRequest, res: Response) {
  try {
    res.json(await getSettingsFromDB());
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
}

export async function updateSettings(req: AuthRequest, res: Response) {
  try {
    const body = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const allowed = [
      "happyUsersCount",
      "tokensSoldCount",
      "prizesWonCount",
      "maintenanceMode",
      "announcementText",
      "whatsappNumber",
      "easypaisaTitle",
      "easypaisaNumber",
      "jazzcashTitle",
      "jazzcashNumber",
      "bankTitle",
      "bankIban",
      "sadapayTitle",
      "sadapayNumber",
      "spinEnabled",
      "socialLinks",
      "footerContent",
      "referralForceEnabled",
      // ✨ NEW: Draw execution settings
      "includeSpinTokensInDraw",
      "spinTokenWeightMultiplier",
      "spinTokenMinimumForDraw",
      "drawExecutionMode",
    ];
    for (const k of allowed) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    const updated = await Settings.findOneAndUpdate({}, updates, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

// ── ADMINS ────────────────────────────────────────────────────────────────────

export async function listAdmins(_req: AuthRequest, res: Response) {
  try {
    const admins = await User.find({ isAdmin: true }).select("name email phone");
    res.json(
      admins.map((a) => ({
        id: a._id.toString(),
        name: a.name ?? null,
        email: a.email ?? null,
        phone: a.phone ?? null,
        referralCode: a.referralCode ?? null,
        city: a.city ?? null,
        province: a.province ?? null,
        tokens: a.tokens ?? 0,
        isAdmin: true,
        suspended: a.suspended ?? false,
        createdAt: a.createdAt,
        referralCount: 0,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
}

export async function grantAdmin(req: AuthRequest, res: Response) {
  try {
    await User.findOneAndUpdate({ email: req.body.email }, { isAdmin: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
}

export async function revokeAdmin(req: AuthRequest, res: Response) {
  try {
    await User.findByIdAndUpdate(req.body.userId, { isAdmin: false });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
}

// ── STORAGE ───────────────────────────────────────────────────────────────────

export async function getStorage(_req: AuthRequest, res: Response) {
  try {
    const uploads = await Upload.find({}).select("fileSizeBytes");
    const totalImages = uploads.length;
    const totalBytes = uploads.reduce((s, i) => s + (i.fileSizeBytes || 0), 0);
    const totalSizeMb = totalBytes / (1024 * 1024);
    const percentageUsed = Math.round((totalSizeMb / STORAGE_LIMIT_MB) * 100);

    let diskSizeMb = 0;
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        try {
          diskSizeMb += (fs.statSync(path.join(uploadsDir, f)).size / (1024 * 1024));
        } catch {}
      }
    }

    res.json({
      totalImages,
      totalSizeMb: Math.max(totalSizeMb, diskSizeMb),
      storageLimitMb: STORAGE_LIMIT_MB,
      percentageUsed: Math.min(100, percentageUsed),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function listImages(req: AuthRequest, res: Response) {
  try {
    const type = req.query.type as string;
    const sortBy = req.query.sort as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Number(req.query.limit) || 24;
    const offset = (page - 1) * limit;

    let query: any = {};
    if (type && type !== "all") {
      query.type = type;
    }

    let allRecords = await Upload.find(query);
    if (sortBy === "size") {
      allRecords = allRecords.sort((a, b) => (b.fileSizeBytes || 0) - (a.fileSizeBytes || 0));
    } else {
      allRecords = allRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    const filtered = allRecords;
    const sliced = filtered.slice(offset, offset + limit);

    const draws = await Draw.find({}).select("_id name imageUrl");
    const drawImageUrls = new Set(draws.map((d) => d.imageUrl).filter(Boolean));

    const annotated = sliced.map((img: any) => {
      const inUse = drawImageUrls.has(img.url);
      const usedByDraw = draws.find((d) => d.imageUrl === img.url);
      const fileSizeLabel =
        img.fileSizeBytes > 1024 * 1024
          ? `${(img.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(img.fileSizeBytes / 1024)} KB`;
      return {
        ...img.toObject(),
        inUse,
        usedByLabel: usedByDraw ? `Draw: ${usedByDraw.name}` : null,
        fileSizeLabel,
      };
    });

    res.json({ images: annotated, total: filtered.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function deleteImage(req: AuthRequest, res: Response) {
  try {
    const filename = Array.isArray(req.params.filename)
      ? req.params.filename[0]
      : req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    let fileDeleted = false;
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        fileDeleted = true;
      }
    } catch {}
    await Upload.deleteOne({ filename }).catch(() => {});
    res.json({
      ok: true,
      fileDeleted,
      dbDeleted: true,
      message: "Image deleted",
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete image", message: err.message });
  }
}

// ── CONTACT MESSAGES ──────────────────────────────────────────────────────────

export async function getContactMessages(req: AuthRequest, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Number(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    let filter: Record<string, any> = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const contacts = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);
    const total = await ContactMessage.countDocuments(filter);
    const openCount = await ContactMessage.countDocuments({ status: "open" });

    const messages = contacts.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      email: c.email ?? null,
      phone: c.phone ?? null,
      subject: c.subject ?? null,
      message: c.message,
      status: c.status,
      adminNotes: c.adminNotes ?? null,
      createdAt: c.createdAt,
      repliedAt: c.repliedAt ?? null,
      screenshotUrl: c.screenshotUrl ?? null,
    }));

    res.json({ messages, contacts: messages, total, openCount, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function updateContactMessage(req: AuthRequest, res: Response) {
  try {
    const { status, adminNotes } = req.body as {
      status?: string;
      adminNotes?: string;
    };
    const updates: Record<string, any> = {};
    if (status !== undefined) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (status === "closed") updates.repliedAt = new Date();

    await ContactMessage.findByIdAndUpdate(req.params.id, updates);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function deleteContactMessage(req: AuthRequest, res: Response) {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}

export async function generateReferralCode(req: AuthRequest, res: Response) {
  try {
    const uid = String(req.params.id);
    const user = await User.findById(uid);
    if (!user) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (user.referralCode) {
      res.json({ ok: true, referralCode: user.referralCode });
      return;
    }
    const code = await generateUniqueReferralCode(uid, typeof user.name === "string" ? user.name : null);
    await User.findByIdAndUpdate(uid, { referralCode: code });
    await Notification.create({
      userId: uid,
      type: "referral",
      title: "Referral Code Generated",
      message: `Your referral code is: ${code}. Share it with friends to earn rewards!`,
    }).catch(() => {});
    res.json({ ok: true, referralCode: code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
}
