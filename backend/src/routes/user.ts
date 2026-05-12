import { Router } from "express";
import {
  User,
  Transaction,
  DrawParticipation,
  Referral,
  Notification,
  Draw,
  Token,
} from "../lib/db-mongoose/index.js";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router = Router();
router.use(requireAuth as any);

// ─── PROFILE ────────────────────────────────────────────────────────────────

router.get("/me", async (req: AuthRequest, res) => {
  try {
    const user = await User.findById(req.userId!);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user._id.toString(),
      name: user.name || null,
      email: user.email || null,
      phone: user.phone || null,
      tokens: user.tokens,
      referralCode: user.referralCode || null,
      city: user.city || null,
      address: user.address || null,
      province: user.province || null,
      cnic: user.cnic || null,
      isAdmin: user.isAdmin,
      suspended: user.suspended,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err: any) {
    console.error("Failed to fetch profile:", err?.message);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.put("/profile", async (req: AuthRequest, res) => {
  try {
    const { name, city, address, province, cnic } = req.body as {
      name?: string;
      city?: string;
      address?: string;
      province?: string;
      cnic?: string;
    };
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name.trim() || null;
    if (city !== undefined) updates.city = city.trim() || null;
    if (address !== undefined) updates.address = address.trim() || null;
    if (province !== undefined) updates.province = province.trim() || null;
    if (cnic !== undefined) updates.cnic = cnic.trim() || null;
    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(req.userId!, updates);
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ─── STATS ──────────────────────────────────────────────────────────────────

router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const activeEntries = await DrawParticipation.countDocuments({
      userId,
      status: "active",
    });

    const referralCount = await Referral.countDocuments({ referrerId: userId });

    const unreadNotifications = await Notification.countDocuments({
      userId,
      read: false,
    });

    const recentTxns = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const recentActivity = recentTxns.map((t) => ({
      type: "transaction",
      text: t.drawName
        ? `${t.tokensCount} token(s) for ${t.drawName} — Rs. ${t.amountPkr}`
        : `${t.tokensCount} token(s) purchased — Rs. ${t.amountPkr}`,
      time: new Date(t.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: t.status,
    }));

    res.json({
      totalTokens: user.tokens,
      activeEntries,
      referralCount,
      unreadNotifications,
      recentActivity,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── TOKENS ─────────────────────────────────────────────────────────────────

router.get("/tokens", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // When the account balance is zero, do not expose stale token rows.
    if ((user.tokens ?? 0) <= 0) {
      res.json({
        totalTokens: 0,
        availableTokens: 0,
        usedTokens: 0,
        tokens: [],
      });
      return;
    }

    const individualTokens = await Token.find({ userId }).sort({
      createdAt: -1,
    });

    const availableCount = individualTokens.filter(
      (t) => t.status === "available"
    ).length;
    const usedCount = individualTokens.filter(
      (t) => t.status === "used"
    ).length;

    // If there are no individual tokens yet (legacy users), fall back to participation-based view
    // only when the user still has a live balance to avoid showing deleted/orphaned rows.
    if (individualTokens.length === 0 && user.tokens > 0) {
      const participations = await DrawParticipation.find({ userId }).sort({
        joinedAt: -1,
      });

      const legacyTokens = participations.flatMap((p) =>
        Array.from({ length: p.tokensUsed }, (_, i) => ({
          id: `#TKN-${p._id}-${i + 1}`,
          tokenNumber: (p._id as any).getTimestamp().getTime() + i + 1,
          draw: p.drawName,
          status: p.status === "active" ? "active" : "used",
          purchased: new Date(p.joinedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          price: `${p.tokensUsed} token${p.tokensUsed > 1 ? "s" : ""}`,
        }))
      );
      res.json({
        totalTokens: user.tokens,
        availableTokens: user.tokens,
        usedTokens: 0,
        tokens: legacyTokens,
      });
      return;
    }

    // Build draw name map from draw IDs
    const participations = await DrawParticipation.find({ userId }).select(
      "drawId drawName"
    );
    const drawNameMap: Record<string, string> = {};
    for (const p of participations) {
      if (p.drawId) {
        drawNameMap[p.drawId.toString()] = p.drawName;
      }
    }

    const tokens = individualTokens.map((t) => ({
      id: `#T-${t.tokenNumber}`,
      tokenNumber: t.tokenNumber,
      draw: t.drawId
        ? drawNameMap[t.drawId.toString()] ?? `Draw #${t.drawId}`
        : "Available",
      status: t.status === "available" ? "active" : "used",
      purchased: new Date(t.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      price: t.status === "used" ? "Used in draw" : "Available",
    }));

    res.json({
      totalTokens: user.tokens,
      availableTokens: availableCount,
      usedTokens: usedCount,
      tokens,
    });
  } catch (err) {
    console.error("[tokens]", err);
    res.status(500).json({ error: "Failed to fetch tokens" });
  }
});

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────

router.get("/transactions", async (req: AuthRequest, res) => {
  try {
    const txns = await Transaction.find({ userId: req.userId! }).sort({
      createdAt: -1,
    });

    res.json(
      txns.map((t) => ({
        id: `#TXN-${t._id}`,
        draw: t.drawName ?? "Token Purchase",
        amount: `Rs. ${t.amountPkr.toLocaleString()}`,
        tokens: t.tokensCount,
        method: t.paymentMethod,
        date: new Date(t.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        status: t.status,
      }))
    );
  } catch {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.post("/transactions", async (req: AuthRequest, res) => {
  try {
    const {
      amountPkr,
      tokensCount,
      paymentMethod,
      drawId,
      drawName,
      screenshotUrl,
      transactionId,
      address,
      name,
      phone,
    } = req.body as {
      amountPkr: number;
      tokensCount: number;
      paymentMethod: string;
      drawId?: string;
      drawName?: string;
      screenshotUrl?: string;
      transactionId?: string;
      address?: string;
      name?: string;
      phone?: string;
    };

    if (!amountPkr || !tokensCount || !paymentMethod) {
      res.status(400).json({
        error: "amountPkr, tokensCount, and paymentMethod are required",
      });
      return;
    }
    if (!transactionId?.trim() || !address?.trim()) {
      res.status(400).json({
        error: "transactionId and address are required",
      });
      return;
    }
    if (amountPkr <= 0 || tokensCount <= 0) {
      res.status(400).json({ error: "Invalid amount or token count" });
      return;
    }
    if (tokensCount > 10000) {
      res.status(400).json({ error: "Token count too large" });
      return;
    }

    const tx = await Transaction.create({
      userId: req.userId!,
      amountPkr: Math.floor(amountPkr),
      tokensCount: Math.floor(tokensCount),
      paymentMethod,
      drawId: drawId ?? null,
      drawName: drawName ?? null,
      screenshotUrl: screenshotUrl ?? null,
      paymentTransactionId: transactionId.trim(),
      customerName: name?.trim() || null,
      customerPhone: phone?.trim() || null,
      customerAddress: address?.trim() || null,
      status: "pending",
    });

    const user = await User.findById(req.userId!);
    if (user?.referredBy) {
      const existing = await Referral.findOne({
        referrerId: user.referredBy,
        referredUserId: req.userId!,
      });
      if (!existing) {
        await Referral.create({
          referrerId: user.referredBy,
          referredUserId: req.userId!,
          rewardGiven: false,
        });
      }
    }

    res.status(201).json({ id: tx._id.toString(), ok: true });
  } catch (err: unknown) {
    console.error("[user.transactions] submit failed:", err);
    res.status(500).json({ error: "Failed to submit transaction" });
  }
});

// ─── DRAWS ──────────────────────────────────────────────────────────────────

router.get("/draws", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Fetch participations
    const participations = await DrawParticipation.find({ userId }).sort({
      joinedAt: -1,
    });

    // Fetch draw details for all draw IDs referenced
    const drawIds = participations
      .map((p) => p.drawId)
      .filter((id) => id != null);

    const drawDetails = drawIds.length > 0
      ? await Draw.find({ _id: { $in: drawIds } })
      : [];

    const drawMap = Object.fromEntries(
      drawDetails.map((d) => [d._id.toString(), d])
    );

    // Count tokens sold per draw
    const tokensSoldRows = drawIds.length > 0
      ? await DrawParticipation.aggregate([
          { $match: { drawId: { $in: drawIds } } },
          {
            $group: {
              _id: "$drawId",
              total: { $sum: "$tokensUsed" },
            },
          },
        ])
      : [];

    const tokensSoldMap = Object.fromEntries(
      tokensSoldRows.map((r) => [r._id.toString(), r.total])
    );

    function mapParticipation(p: typeof participations[0], past: boolean) {
      const d = drawMap[p.drawId?.toString() ?? ""] ?? null;
      const drawStatus = d?.status ?? p.status;
      return {
        id: p._id.toString(),
        drawId: p.drawId?.toString(),
        name: p.drawName,
        prize: p.prize,
        tokens: p.tokensUsed,
        joinedAt: new Date(p.joinedAt).toISOString(),
        drawStatus,
        ...(past
          ? {
              date: new Date(p.joinedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              result: p.result,
            }
          : {}),
        prizeValuePkr: d?.prizeValuePkr ?? null,
        tokenLimit: d?.tokenLimit ?? null,
        tokensSold: tokensSoldMap[p.drawId?.toString() ?? ""] ?? 0,
        status: p.status,
        prizeDeliveryStatus: p.prizeDeliveryStatus,
      };
    }

    res.json({
      activeDraws: participations
        .filter((p) => {
          const d = drawMap[p.drawId?.toString() ?? ""] ?? null;
          const drawStatus = d?.status ?? p.status;
          return drawStatus === "active" && p.status === "active" && p.result == null;
        })
        .map((p) => mapParticipation(p, false)),
      pastDraws: participations
        .filter((p) => {
          const d = drawMap[p.drawId?.toString() ?? ""] ?? null;
          const drawStatus = d?.status ?? p.status;
          return drawStatus !== "active" || p.result != null || p.status !== "active";
        })
        .map((p) => mapParticipation(p, true)),
    });
  } catch (err) {
    console.error("[user/draws]", err);
    res.status(500).json({ error: "Failed to fetch draws" });
  }
});

router.post("/draws/:drawId/join", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const drawId = req.params.drawId;
    const { tokensCount } = req.body as { tokensCount: number };

    if (!tokensCount || tokensCount < 1) {
      res.status(400).json({ error: "At least 1 token required" });
      return;
    }

    const draw = await Draw.findById(drawId);
    if (!draw) {
      res.status(404).json({ error: "Draw not found" });
      return;
    }
    if (draw.status !== "active") {
      res.status(400).json({ error: "Draw is not active" });
      return;
    }

    const user = await User.findById(userId);
    if (!user || user.tokens < tokensCount) {
      res.status(400).json({ error: "Insufficient tokens" });
      return;
    }

    // Create participation
    const participation = await DrawParticipation.create({
      userId,
      drawId,
      drawName: draw.name,
      prize: draw.prize,
      tokensUsed: tokensCount,
      status: "active",
    });

    // Deduct tokens
    await User.findByIdAndUpdate(userId, {
      $inc: { tokens: -tokensCount },
    });

    // Mark individual tokens as used and link them to this draw
    const availableTokens = await Token.find({
      userId,
      status: "available",
    })
      .sort({ tokenNumber: 1 })
      .limit(tokensCount);

    if (availableTokens.length > 0) {
      await Token.updateMany(
        { _id: { $in: availableTokens.map((t) => t._id) } },
        { $set: { status: "used", drawId } }
      );
    }

    const updated = await User.findById(userId);

    res.json({
      ok: true,
      participationId: participation._id.toString(),
      newTokens: updated?.tokens ?? 0,
      assignedTokens: availableTokens.map((t) => t._id.toString()),
    });
  } catch (err) {
    console.error("[join draw]", err);
    res.status(500).json({ error: "Failed to join draw" });
  }
});

// ─── REFERRALS ───────────────────────────────────────────────────────────────

router.get("/referrals", async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [purchaseResult] = await Transaction.aggregate([
      { $match: { userId, status: "approved" } },
      { $group: { _id: null, totalTokensPurchased: { $sum: "$tokensCount" } } },
    ]);

    const totalTokensPurchased = purchaseResult?.totalTokensPurchased ?? 0;
    const isEligible =
      Boolean(user.referralForceEnabled) || totalTokensPurchased >= 100;

    if (!isEligible && user.referralCode) {
      await User.findByIdAndUpdate(userId, { $unset: { referralCode: "" } });
    }

    let referralCode = isEligible ? user.referralCode : null;
    if (isEligible && !referralCode) {
      const base = (user.name || `USER${userId}`)
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
        if (!existing) {
          referralCode = code;
          await User.findByIdAndUpdate(userId, { referralCode: code });
          break;
        }
      }
    }

    const referrals = await Referral.find({ referrerId: userId })
      .populate("referredUserId", "name email phone createdAt")
      .sort({ createdAt: -1 });

    res.json({
      referralEnabled: isEligible,
      isEligible,
      totalTokensPurchased,
      referralCode,
      totalReferrals: referrals.length,
      earnedTokens: referrals.filter((r) => r.rewardGiven).length,
      referrals: referrals.map((r) => ({
        name:
          (r.referredUserId as any)?.name ||
          (r.referredUserId as any)?.email ||
          (r.referredUserId as any)?.phone ||
          "Anonymous",
        joined: new Date(
          (r.referredUserId as any)?.createdAt || r.createdAt
        ).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        rewardGiven: r.rewardGiven,
      })),
      message: isEligible
        ? undefined
        : "Referral is locked. Purchase at least 100 tokens.",
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch referrals" });
  }
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

router.get("/notifications", async (req: AuthRequest, res) => {
  try {
    const notifs = await Notification.find({ userId: req.userId! })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(
      notifs.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        read: n.read,
        time: new Date(n.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      }))
    );
  } catch {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.put("/notifications/read-all", async (req: AuthRequest, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId!, read: false },
      { read: true }
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

router.put("/notifications/:id/read", async (req: AuthRequest, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
