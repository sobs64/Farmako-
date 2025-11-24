import express from "express";
import {
  createSchedule,
  getDoctorSchedules,
} from "../controllers/scheduleController.js";

const router = express.Router();

router.post("/", createSchedule);
router.get("/doctor/:doctorId", getDoctorSchedules);

export default router;
