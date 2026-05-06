import { Router } from "express";
import { Draw, DrawParticipation, Settings, User } from "../lib/db-mongoose/index.js";

const router = Router();

async function getSettings() {
  let settings = await Settings.findOne({});
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
}

async function ensureDemoDraw() {
  const existing = await Draw.findOne({});
  if (existing) return;
  await Draw.create({
    name: "Toyota Corolla Dream Draw",
    category: "Cars",
    prize: "Toyota Corolla",
    prizeValuePkr: 3500000,
    tokenPricePkr: 100,
    tokenLimit: 100000,
    imageUrl: "/api/uploads/draw_1777746156784_fm7kka.jfif",
    status: "active",
    badges: "verified,featured",
  });
}

function formatDrawWinner(draw: { winners?: Array<{ name?: string; city?: string }> }) {
  const winner = draw.winners?.[0];
  return winner
    ? { winner: { name: winner.name ?? "Anonymous", city: winner.city ?? "Pakistan" } }
    : { winner: null };
}

router.get("/settings/stats", async (_req, res) => {
  try {
    const s = await getSettings();
    res.json({
      happyUsersCount: s.happyUsersCount,
      tokensSoldCount: s.tokensSoldCount,
      prizesWonCount: s.prizesWonCount,
      maintenanceMode: s.maintenanceMode,
      announcementText: s.announcementText,
      socialLinks: s.socialLinks ?? "[]",
      footerContent: s.footerContent ?? null,
      whatsappNumber: s.whatsappNumber ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load stats" });
  }
});

router.get("/settings/payment", async (_req, res) => {
  try {
    const s = await getSettings();
    res.json({
      easypaisa: { title: s.easypaisaTitle, number: s.easypaisaNumber },
      jazzcash: { title: s.jazzcashTitle, number: s.jazzcashNumber },
      bank: { title: s.bankTitle, iban: s.bankIban },
      sadapay: { title: s.sadapayTitle, number: s.sadapayNumber },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load payment info" });
  }
});

router.get("/draws", async (_req, res) => {
  try {
    await ensureDemoDraw();
    const draws = await Draw.find({
      status: { $in: ["active", "drawn"] },
    });

    if (draws.length === 0) {
      res.json([
        {
          id: "0",
          name: "Toyota Corolla Dream Draw",
          category: "Cars",
          prize: "Toyota Corolla",
          prizeValuePkr: 3500000,
          tokenPricePkr: 100,
          tokenLimit: 100000,
          imageUrl: "/api/uploads/draw_1777746156784_fm7kka.jfif",
          status: "active",
          badges: "verified,featured",
          startsAt: null,
          endsAt: null,
          tokensSold: 0,
          participantCount: 0,
        },
      ]);
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

    const tokensSoldMap = Object.fromEntries(
      tokensSoldAgg.map((r) => [r._id.toString(), r.total])
    );
    const participantCountMap = Object.fromEntries(
      tokensSoldAgg.map((r) => [r._id.toString(), r.count])
    );

    res.json(
      draws.map((d) => ({
        id: d._id.toString(),
        ...d.toObject(),
        tokensSold: tokensSoldMap[d._id.toString()] ?? 0,
        participantCount: participantCountMap[d._id.toString()] ?? 0,
        ...formatDrawWinner(d),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/draws/:id", async (req, res) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) {
      res.status(404).json({ error: "Draw not found" });
      return;
    }

    const [tokensSoldRow] = await DrawParticipation.aggregate([
      { $match: { drawId: draw._id } },
      {
        $group: {
          _id: null,
          total: { $sum: "$tokensUsed" },
          count: { $addToSet: "$userId" },
        },
      },
      {
        $project: {
          total: 1,
          count: { $size: "$count" },
        },
      },
    ]) || [{ total: 0, count: 0 }];

    res.json({
      id: draw._id.toString(),
      ...draw.toObject(),
      tokensSold: tokensSoldRow?.total ?? 0,
      participantCount: tokensSoldRow?.count ?? 0,
      ...formatDrawWinner(draw),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/winners", async (_req, res) => {
  try {
    const rows = await DrawParticipation.find({ result: "won" })
      .populate({
        path: "userId",
        model: User,
        select: "name city",
      })
      .populate({
        path: "drawId",
        model: Draw,
        select: "imageUrl",
      })
      .sort({ joinedAt: -1 })
      .limit(50);

    res.json(
      rows.map((w) => ({
        id: w._id.toString(),
        drawName: w.drawName ?? "Unknown Draw",
        prize: w.displayPrize ?? w.prize ?? null,
        city: w.displayCity ?? (w.userId as any)?.city ?? "Pakistan",
        name: w.displayName ?? (w.userId as any)?.name ?? "Anonymous",
        date: w.joinedAt,
        tokenNumber: w.winningTokenNumber ?? null,
        tokenLabel: w.displayTokenLabel ?? null,
        dateLabel: w.displayDateLabel ?? null,
        imageUrl: w.displayImageUrl ?? (w.drawId as any)?.imageUrl ?? null,
        avatarUrl: w.displayAvatarUrl ?? null,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
