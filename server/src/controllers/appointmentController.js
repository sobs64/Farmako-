// src/controllers/appointmentController.js
import Appointment from "../models/Appointment.js";

// 📅 Patient books an appointment
export const bookAppointment = async (req, res) => {
  try {
    const { doctorId, scheduledTime } = req.body;
    const patientId = req.user._id; // from JWT middleware

    const appointment = await Appointment.create({
      doctorId,
      patientId,
      scheduledTime,
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👩‍⚕️ Doctor views current queue
export const getQueue = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const queue = await Appointment.find({ doctorId, status: "waiting" })
      .populate("patientId", "name email")
      .sort("createdAt");

    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🩺 Doctor updates appointment status
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 👤 Patient gets their appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user._id; // from JWT middleware
    const appointments = await Appointment.find({ patientId })
      .populate("doctorId", "name email specialization")
      .sort({ scheduledTime: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};