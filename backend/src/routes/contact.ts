import { Router } from "express";
import { ContactMessage } from "../lib/db-mongoose/index.js";
import { requireAdmin, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.post("/contact", async (req, res) => {
  try {
    const { name, email, phone, subject, message, screenshotUrl } = req.body as {
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
      screenshotUrl?: string;
    };
    if (!name || !email || !phone || !subject || !message) {
      res.status(400).json({ error: "All fields are required." });
      return;
    }
    const msg = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message,
      screenshotUrl: screenshotUrl || null,
    });
    res.status(201).json({ ok: true, id: msg._id.toString() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit." });
  }
});

router.get("/admin/contact", requireAdmin as any, async (req: AuthRequest, res) => {
  try {
    const status = req.query.status as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    let filter: Record<string, any> = {};
    if (status && status !== "all") {
      filter.status = status;
    }

    const messages = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await ContactMessage.countDocuments(filter);
    const open = await ContactMessage.countDocuments({ status: "open" });

    res.json({
      messages: messages.map((m) => ({
        ...m.toObject(),
        id: m._id.toString(),
      })),
      total,
      openCount: open,
      page,
      limit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

router.put("/admin/contact/:id", requireAdmin as any, async (req: AuthRequest, res) => {
  try {
    const { status, adminNotes } = req.body as {
      status?: string;
      adminNotes?: string;
    };
    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (status === "replied") updates.repliedAt = new Date();
    await ContactMessage.findByIdAndUpdate(req.params.id, updates);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

router.delete("/admin/contact/:id", requireAdmin as any, async (req: AuthRequest, res) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

export default router;
