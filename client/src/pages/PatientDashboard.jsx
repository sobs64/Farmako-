import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  CalendarDays,
  Clock,
  User,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // 🧩 Fetch all doctors
  const fetchDoctors = async () => {
    try {
      const { data } = await API.get("/auth/doctors");
      setDoctors(data);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  // 🧩 Fetch patient's appointments
  const fetchAppointments = async () => {
    try {
      const { data } = await API.get(`/appointments/patient/${user._id}`);
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🧩 Fetch doctor’s available slots
  const handleBookClick = async (doctor) => {
    try {
      const { data } = await API.get(`/schedules/doctor/${doctor._id}`);
      setSelectedDoctor({
        ...doctor,
        availableSlots: data.availableSlots || [],
      });
      setShowSlotModal(true);
    } catch (err) {
      alert("Could not fetch doctor’s available slots");
    }
  };

  // 🧩 Confirm appointment booking
  const confirmBooking = async () => {
    if (!selectedSlot) {
      alert("Please select a time slot.");
      return;
    }

    try {
      await API.post("/appointments", {
        doctorId: selectedDoctor._id,
        patientId: user._id,
        scheduledTime: selectedSlot,
      });

      alert("✅ Appointment booked successfully!");
      setShowSlotModal(false);
      setSelectedSlot("");
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to book appointment");
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            🧑‍⚕️ Patient Dashboard
          </h1>
          <p className="text-gray-500">
            Browse doctors, view their schedules, and manage your appointments.
          </p>
        </div>

        {/* List of Doctors */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <User className="text-blue-600" size={20} /> Available Doctors
          </h2>
          {doctors.length === 0 ? (
            <p className="text-gray-500 italic">No doctors available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-gray-500">{doctor.email}</p>
                    <p className="text-sm text-gray-600 italic">
                      {doctor.specialization || "General Practitioner"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleBookClick(doctor)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    View Slots & Book
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment History */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <CalendarDays className="text-blue-600" size={20} /> Appointment
            History
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500 italic">
              You don’t have any appointments yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {appointments.map((apt) => (
                <li
                  key={apt._id}
                  className="flex justify-between items-center py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {apt.doctorName || "Dr. Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {apt.scheduledTime}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      apt.status === "waiting"
                        ? "bg-yellow-100 text-yellow-700"
                        : apt.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {apt.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Modal for slot selection */}
        {showSlotModal && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-[90%] max-w-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="text-blue-600" size={20} />
                  {selectedDoctor.name}'s Available Slots
                </h3>
                <button
                  onClick={() => setShowSlotModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {selectedDoctor.availableSlots?.length ? (
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {selectedDoctor.availableSlots.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        setSelectedSlot(`${slot.dayOfWeek} ${slot.time}`)
                      }
                      className={`border p-2 rounded-lg text-sm transition ${
                        selectedSlot === `${slot.dayOfWeek} ${slot.time}`
                          ? "bg-blue-600 text-white border-blue-600"
                          : "hover:bg-blue-50 border-gray-200"
                      }`}
                    >
                      <span className="block font-medium">{slot.time}</span>
                      <span className="text-xs text-gray-500">
                        {slot.dayOfWeek}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No available slots for this doctor.
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSlotModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmBooking}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
