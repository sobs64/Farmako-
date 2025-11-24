import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dayOfWeek: { type: String, required: true },
  availableSlots: [String], // example: ["09:00 AM", "09:30 AM"]
}, { timestamps: true });

export default mongoose.model("Schedule", scheduleSchema);
