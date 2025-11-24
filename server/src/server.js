import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// ✅ Load environment variables BEFORE anything else
dotenv.config();

// ✅ Connect to MongoDB
connectDB();

// ✅ Initialize app
const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Import Routes
import authRoutes from "./routes/authRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

// ✅ Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/appointments", appointmentRoutes);

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.status(200).send("🚀 API is running and connected successfully!");
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
