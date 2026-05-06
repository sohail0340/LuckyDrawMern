import { Router } from "express";
import { requireAdmin } from "../lib/auth.js";
import * as adminController from "../controllers/adminController.js";

const router = Router();
router.use(requireAdmin as any);

// ── STATS ─────────────────────────────────────────────────────────────────────
router.get("/stats", adminController.getStats);

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
router.get("/analytics", adminController.getAnalytics);

// ── USERS ─────────────────────────────────────────────────────────────────────
router.get("/users", adminController.listUsers);
router.get("/users/:id", adminController.getUser);
router.get("/users/:id/tokens", adminController.getUserTokens);
router.delete("/users/:id/tokens/:tokenId", adminController.deleteUserToken);
router.delete("/users/:id/tokens", adminController.deleteUserTokens);
router.put("/users/:id/tokens", adminController.adjustUserTokens);
router.put("/users/:id/suspend", adminController.suspendUser);
router.put("/users/:id/flags", adminController.setUserFlags);
router.post("/users/:id/notify", adminController.notifyUser);

// ── DRAWS ─────────────────────────────────────────────────────────────────────
router.get("/draws", adminController.listDraws);
router.post("/draws", adminController.createDraw);
router.put("/draws/:id", adminController.updateDraw);
router.delete("/draws/:id", adminController.deleteDraw);
router.delete("/draws/:id/participants", adminController.deleteDrawParticipants);
router.post("/draws/:id/trigger", adminController.triggerDraw);
router.get("/draws/:id/tokens", adminController.getDrawTokens);
router.get("/draws/:id/participants", adminController.getDrawParticipants);

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────
router.get("/transactions", adminController.listTransactions);
router.put("/transactions/:id/approve", adminController.approveTransaction);
router.put("/transactions/:id/reject", adminController.rejectTransaction);
router.delete("/transactions/:id", adminController.deleteTransaction);
router.post("/users/:id/generate-referral", adminController.generateReferralCode);

// ── WINNERS ───────────────────────────────────────────────────────────────────
router.get("/winners", adminController.listWinners);
router.put("/winners/:id", adminController.updateWinner);
router.put("/winners/:id/delivery", adminController.updateDelivery);
router.delete("/winners/:id", adminController.deleteWinner);

// ── REFERRALS ─────────────────────────────────────────────────────────────────
router.get("/referrals", adminController.listReferrals);
router.post("/referrals/:id/grant", adminController.grantReferral);
router.delete("/referrals/:id", adminController.revokeReferral);

// ── SETTINGS ──────────────────────────────────────────────────────────────────
router.get("/settings", adminController.getSettings);
router.put("/settings", adminController.updateSettings);

// ── ADMINS ────────────────────────────────────────────────────────────────────
router.get("/admins", adminController.listAdmins);
router.post("/admins/grant", adminController.grantAdmin);
router.post("/admins/revoke", adminController.revokeAdmin);

// ── STORAGE ───────────────────────────────────────────────────────────────────
router.get("/storage", adminController.getStorage);
router.get("/images", adminController.listImages);
router.delete("/images/:filename", adminController.deleteImage);

// ── CONTACT MESSAGES ──────────────────────────────────────────────────────────
router.get("/contact", adminController.getContactMessages);
router.put("/contact/:id", adminController.updateContactMessage);
router.delete("/contact/:id", adminController.deleteContactMessage);

export default router;
