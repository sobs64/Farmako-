// src/routes/appointmentRoutes.js
import express from "express";
import {
  bookAppointment,
  getQueue,
  updateStatus,
  getPatientAppointments
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Patient books appointment
router.post("/", protect, bookAppointment);

// Patient gets their appointments
router.get("/patient", protect, getPatientAppointments);

// Doctor views queue
router.get("/queue/:id", protect, getQueue);

// Doctor updates appointment status
router.patch("/:id/status", protect, updateStatus);

export default router;
