import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import userRouter from "./user.js";
import spinRouter from "./spin.js";
import adminRouter from "./admin.js";
import publicRouter from "./public.js";
import uploadRouter from "./upload.js";
import pagesRouter from "./pages.js";
import contactRouter from "./contact.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/user", userRouter);
router.use("/spin", spinRouter);
router.use("/admin", adminRouter);
router.use("/upload", uploadRouter);
router.use(pagesRouter);
router.use(publicRouter);
router.use(contactRouter);

export default router;
