// src/routes/authRoutes.js
import express from "express";
import { registerUser, loginUser, getDoctors } from "../controllers/authController.js";

const router = express.Router();

// Register new user
router.post("/register", registerUser);

// Login user
router.post("/login", loginUser);

// Get all doctors
router.get("/doctors", getDoctors);

export default router; // 👈 VERY IMPORTANT
