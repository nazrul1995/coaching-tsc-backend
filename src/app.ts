const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
import cors from "cors";
import express, { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";

import router from "./routes";

const app: Application = express();

// ===============================
// Parsers / Middleware
// ===============================

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

// ===============================
// CORS
// ===============================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// ===============================
// Application Routes
// ===============================

app.use("/api/v1", router);

// ===============================
// Testing Route
// ===============================

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Event Management Server is running!",
  });
});

// ===============================
// Not Found Route
// ===============================

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;