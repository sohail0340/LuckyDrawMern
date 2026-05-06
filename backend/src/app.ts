import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Express = express();

// Trust the first proxy (Replit's reverse proxy) so rate limiters work correctly
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);
// Allow cross-origin requests from frontend during development and production
app.use(cors({ origin: process.env.CLIENT_URL ?? true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files at /api/uploads/*
// upload.ts saves to __dirname/../../uploads (two levels up from dist/)
const uploadsDir = path.join(__dirname, "..", "..", "uploads");
app.use("/api/uploads", express.static(uploadsDir));

app.use("/api", router);

// Return JSON 404 for any /api/* requests not handled by router
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler to ensure JSON responses and structured logging
app.use((err: any, req: any, res: any, next: any) => {
  try {
    logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
  } catch {}
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
