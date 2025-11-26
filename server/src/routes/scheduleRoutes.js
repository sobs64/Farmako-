import express from "express";
import {
  createSchedule,
  getDoctorSchedules,
  deleteScheduleSlot,
} from "../controllers/scheduleController.js";

const router = express.Router();

router.post("/", createSchedule);
router.get("/doctor/:doctorId", getDoctorSchedules);
router.post("/delete-slot", deleteScheduleSlot);

export default router;
