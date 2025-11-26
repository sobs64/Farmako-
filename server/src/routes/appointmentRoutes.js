// src/routes/appointmentRoutes.js
import express from "express";
import {
  bookAppointment,
  getQueue,
  updateStatus,
  getPatientAppointments,
  getDoctorAppointments,
  addRemarks
} from "../controllers/appointmentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Patient books appointment
router.post("/", protect, bookAppointment);

// Patient gets their appointments
router.get("/patient", protect, getPatientAppointments);

// Doctor gets all appointments
router.get("/doctor", protect, getDoctorAppointments);

// Doctor views queue
router.get("/queue/:id", protect, getQueue);

// Doctor updates appointment status
router.patch("/:id/status", protect, updateStatus);

// Doctor adds remarks to appointment
router.patch("/:id/remarks", protect, addRemarks);

export default router;
