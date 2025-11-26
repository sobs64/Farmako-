// src/controllers/appointmentController.js
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

// 📅 Patient books an appointment
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, scheduledTime } = req.body;

    if (!doctorId || !patientId) {
      return res.status(400).json({ message: "doctorId and patientId are required" });
    }

    // Use current date and time if scheduledTime is not provided or use provided time
    const scheduledDate = scheduledTime ? new Date(scheduledTime) : new Date();
    
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ message: "Invalid scheduled time format" });
    }

    const appointment = await Appointment.create({
      doctorId,
      patientId,
      scheduledTime: scheduledDate,
      status: "waiting"
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({ message: error.message });
  }
};

// 👩‍⚕️ Doctor views current queue
export const getQueue = async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    const queue = await Appointment.find({ 
      doctorId, 
      status: { $in: ["waiting", "in_progress"] }
    })
      .populate("patientId", "name email")
      .sort({ scheduledTime: 1 }); // Sort by real scheduled time (ascending - earliest first)

    // Format response with patient names and real-time scheduledTime
    const formattedQueue = queue.map(apt => ({
      _id: apt._id,
      patientName: apt.patientId?.name || "Unknown",
      scheduledTime: apt.scheduledTime ? new Date(apt.scheduledTime).toISOString() : null,
      status: apt.status,
      createdAt: apt.createdAt ? new Date(apt.createdAt).toISOString() : null
    }));

    res.json(formattedQueue);
  } catch (error) {
    console.error("Error fetching queue:", error);
    res.status(500).json({ message: error.message });
  }
};

// 🩺 Doctor updates appointment status
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["waiting", "in_progress", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("patientId", "name email");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: error.message });
  }
};

// 📝 Doctor adds/updates remarks for an appointment
export const addRemarks = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks || remarks.trim() === "") {
      return res.status(400).json({ message: "Remarks cannot be empty" });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { 
        remarks: remarks.trim(),
        remarksAddedAt: new Date()
      },
      { new: true }
    )
      .populate("patientId", "name email")
      .populate("doctorId", "name email specialization");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    console.error("Error adding remarks:", error);
    res.status(500).json({ message: error.message });
  }
};

// 👤 Patient gets their appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user?._id || req.params.id;
    if (!patientId) {
      return res.status(400).json({ message: "Missing patient identifier" });
    }

    const appointments = await Appointment.find({ patientId })
      .populate("doctorId", "name email specialization")
      .sort({ scheduledTime: -1 });

    const formattedAppointments = appointments.map((apt) => ({
      _id: apt._id,
      doctorId: apt.doctorId?._id,
      doctorName: apt.doctorId?.name || "Unknown Doctor",
      doctorSpecialization: apt.doctorId?.specialization || "General",
      scheduledTime: apt.scheduledTime,
      status: apt.status,
      timeSlot: apt.scheduledTime,
      remarks: apt.remarks || "",
      remarksAddedAt: apt.remarksAddedAt,
      createdAt: apt.createdAt,
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({ message: error.message });
  }
};

// 👨‍⚕️ Doctor gets all appointments by status
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user?._id || req.params.id;
    if (!doctorId) {
      return res.status(400).json({ message: "Missing doctor identifier" });
    }

    const appointments = await Appointment.find({ doctorId })
      .populate("patientId", "name email")
      .sort({ scheduledTime: 1 });

    const formattedAppointments = appointments.map((apt) => ({
      _id: apt._id,
      patientId: apt.patientId?._id,
      patientName: apt.patientId?.name || "Unknown Patient",
      patientEmail: apt.patientId?.email || "N/A",
      scheduledTime: apt.scheduledTime,
      status: apt.status,
      remarks: apt.remarks || "",
      remarksAddedAt: apt.remarksAddedAt,
      createdAt: apt.createdAt,
    }));

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ message: error.message });
  }
};