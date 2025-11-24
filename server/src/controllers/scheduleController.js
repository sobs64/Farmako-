import Schedule from "../models/Schedule.js";

// Create new schedule
export const createSchedule = async (req, res) => {
  try {
    const { doctorId, dayOfWeek, availableSlots } = req.body;
    if (!doctorId || !dayOfWeek || !availableSlots.length)
      return res.status(400).json({ message: "All fields are required" });

    const schedule = await Schedule.create({ doctorId, dayOfWeek, availableSlots });
    res.status(201).json(schedule);
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({ message: "Failed to create schedule" });
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
