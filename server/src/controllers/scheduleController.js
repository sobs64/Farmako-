import Schedule from "../models/Schedule.js";

// Create or update schedule (prevents duplicates)
export const createSchedule = async (req, res) => {
  try {
    const { doctorId, dayOfWeek, availableSlots } = req.body;
    if (!doctorId || !dayOfWeek || !availableSlots.length)
      return res.status(400).json({ message: "All fields are required" });

    // Use findOneAndUpdate with upsert to update existing or create new
    // This prevents duplicates when updating schedules
    const schedule = await Schedule.findOneAndUpdate(
      { doctorId, dayOfWeek }, // Find existing schedule for this doctor and day
      { doctorId, dayOfWeek, availableSlots }, // Update with new slots
      { new: true, upsert: true } // Create if doesn't exist, return updated doc
    );
    
    res.status(201).json(schedule);
  } catch (error) {
    console.error("Error creating/updating schedule:", error);
    res.status(500).json({ message: "Failed to create/update schedule" });
  }
};

// ✅ Get all schedules for a doctor, merged and flattened
export const getDoctorSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ doctorId: req.params.doctorId });

    if (!schedules.length)
      return res.status(404).json({ message: "No schedules found for this doctor" });

    // Flatten all available slots
    const mergedSlots = schedules.flatMap((s) =>
      s.availableSlots.map((slot) => ({
        dayOfWeek: s.dayOfWeek,
        time: slot,
      }))
    );

    res.json({
      doctorId: req.params.doctorId,
      availableSlots: mergedSlots,
    });
  } catch (err) {
    console.error("Error fetching doctor schedules:", err);
    res.status(500).json({ message: "Failed to fetch doctor schedules" });
  }
};

// Delete a specific slot from a schedule
export const deleteScheduleSlot = async (req, res) => {
  try {
    const { doctorId, dayOfWeek, time } = req.body;

    if (!doctorId || !dayOfWeek || !time) {
      return res.status(400).json({ message: "doctorId, dayOfWeek, and time are required" });
    }

    // Find the schedule for this doctor and day
    const schedule = await Schedule.findOne({ doctorId, dayOfWeek });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Remove the specific time slot
    schedule.availableSlots = schedule.availableSlots.filter(slot => slot !== time);

    // If no slots remain, delete the entire schedule document
    if (schedule.availableSlots.length === 0) {
      await Schedule.findByIdAndDelete(schedule._id);
      return res.json({ message: "Schedule deleted (no slots remaining)", deleted: true });
    }

    // Otherwise, save the updated schedule
    await schedule.save();
    res.json({ message: "Slot deleted successfully", schedule });
  } catch (error) {
    console.error("Error deleting schedule slot:", error);
    res.status(500).json({ message: "Failed to delete schedule slot" });
  }
};
