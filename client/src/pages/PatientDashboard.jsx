import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/ChatWindow";
import {
  CalendarDays,
  Clock,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  Timer,
  FileText,
} from "lucide-react";

const DAY_TO_INDEX = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const buildSlotKey = (slot) => `${slot.dayOfWeek}-${slot.time}`;

const convertSlotToISO = (slot) => {
  if (!slot?.dayOfWeek || !slot?.time) return null;

  const startRange = slot.time.split(" - ")[0]?.trim();
  if (!startRange) return null;

  const [timePart, meridiem] = startRange.split(" ");
  if (!timePart || !meridiem) return null;

  let [hours, minutes] = timePart.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  const meridian = meridiem.toUpperCase();
  if (meridian === "PM" && hours !== 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  // Use current date and time as base
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();
  const currentDay = now.getDay();
  
  const desiredDay = DAY_TO_INDEX[slot.dayOfWeek];
  if (desiredDay === undefined) return null;

  // Calculate days until target day (next occurrence)
  let daysUntilTarget = (desiredDay - currentDay + 7) % 7;
  
  // Create target date using current date/time as base
  const target = new Date(currentYear, currentMonth, currentDate + daysUntilTarget, hours, minutes, 0, 0);
  
  // If it's the same day but the time has passed, schedule for next week
  if (daysUntilTarget === 0 && target <= now) {
    target.setDate(target.getDate() + 7); // Schedule for next week
  }

  return target.toISOString();
};

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedDoctorForChat, setSelectedDoctorForChat] = useState(null);
  const [queueData, setQueueData] = useState({});
  const [waitTimes, setWaitTimes] = useState({});

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
  const handleSessionTimeout = () => {
    alert("Your session has expired. Please log in again.");
    logout();
    navigate("/");
  };

  const fetchAppointments = async () => {
    if (!user) return;
    try {
      setAppointmentsLoading(true);
      const { data } = await API.get("/appointments/patient");
      setAppointments(data);
    } catch (err) {
      if (err.response?.status === 401) {
        handleSessionTimeout();
      } else {
        console.error("Error fetching appointments:", err);
      }
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // 🧩 Fetch doctor’s available slots
  const handleBookClick = async (doctor) => {
    try {
      const { data } = await API.get(`/schedules/doctor/${doctor._id}`);
      const slots = data?.availableSlots || [];

      if (!slots.length) {
        alert("This doctor has not published any available slots yet.");
        return;
      }

      setSelectedDoctor({
        ...doctor,
        availableSlots: slots,
      });
      setSelectedSlot(null);
      setSelectedDay(null);
      setShowSlotModal(true);
    } catch (err) {
      if (err.response?.status === 404) {
        alert("No schedules found for this doctor.");
      } else {
        console.error("Error fetching doctor schedules:", err);
        alert("Could not fetch doctor’s available slots");
      }
    }
  };

  // 🧩 Confirm appointment booking
  const confirmBooking = async () => {
    if (!selectedDay) {
      alert("Please select a day first.");
      return;
    }
    if (!selectedSlot) {
      alert("Please select a time slot.");
      return;
    }

    if (!user) {
      alert("Please log in as a patient before booking an appointment.");
      navigate("/");
      return;
    }

    // Use current date and time when booking
    const scheduledTimeISO = new Date().toISOString();

    try {
      await API.post("/appointments", {
        doctorId: selectedDoctor._id,
        patientId: user._id,
        scheduledTime: scheduledTimeISO,
      });

      alert("✅ Appointment booked successfully!");
      setShowSlotModal(false);
      setSelectedSlot(null);
      setSelectedDay(null);
      fetchAppointments();
    } catch (err) {
      if (err.response?.status === 401) {
        handleSessionTimeout();
      } else {
        alert(err.response?.data?.message || "Failed to book appointment");
      }
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Fetch queue and calculate wait times for each doctor
  const fetchQueueAndWaitTime = async (doctorId) => {
    try {
      const { data: queue } = await API.get(`/appointments/queue/${doctorId}`);
      setQueueData((prev) => ({ ...prev, [doctorId]: queue }));

      // Calculate wait time using the prediction utility logic
      const completed = queue.filter(
        (apt) => apt.status === "completed" && apt.checkInTime && apt.completedTime
      );
      
      // Each patient gets at least 10 minutes with the doctor
      let avgDuration = 10; // Minimum 10 minutes per patient
      if (completed.length > 0) {
        const calculatedAvg =
          completed.reduce((sum, apt) => {
            const duration =
              (new Date(apt.completedTime) - new Date(apt.checkInTime)) / 60000;
            return sum + duration;
          }, 0) / completed.length;
        // Use the calculated average, but ensure minimum is 10 minutes
        avgDuration = Math.max(calculatedAvg, 10);
      }

      const waitingCount = queue.filter((apt) => apt.status === "waiting").length;
      const predictedWait = Math.round(avgDuration * waitingCount);
      
      setWaitTimes((prev) => ({ ...prev, [doctorId]: predictedWait }));
    } catch (err) {
      console.error("Error fetching queue:", err);
    }
  };

  // Calculate patient's position in queue
  const getPatientQueuePosition = (doctorId) => {
    const queue = queueData[doctorId] || [];
    const patientAppointments = appointments.filter((apt) => {
      const aptDoctorId = typeof apt.doctorId === 'object' ? apt.doctorId?._id : apt.doctorId;
      return aptDoctorId === doctorId && apt.status === "waiting";
    });
    
    if (patientAppointments.length === 0) return null;

    const patientApt = patientAppointments[0];
    const waitingBefore = queue.filter(
      (apt) =>
        apt.status === "waiting" &&
        new Date(apt.scheduledTime) < new Date(patientApt.scheduledTime)
    ).length;

    return waitingBefore + 1;
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [authLoading, user]);

  // Fetch queue data for all doctors the patient has appointments with
  useEffect(() => {
    if (appointments.length > 0) {
      const uniqueDoctorIds = [
        ...new Set(
          appointments
            .map((apt) => {
              // Handle both object and string doctorId
              return typeof apt.doctorId === 'object' ? apt.doctorId?._id : apt.doctorId;
            })
            .filter(Boolean)
        ),
      ];
      uniqueDoctorIds.forEach((doctorId) => {
        fetchQueueAndWaitTime(doctorId);
      });
    }
  }, [appointments]);

  if (!authLoading && (!user || user.role !== "patient")) {
    return (
      <DashboardLayout>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6 text-center">
          <p className="text-gray-600 dark:text-slate-300">
            Please log in as a patient to view this dashboard.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 flex items-center gap-2">
            🧑‍⚕️ Patient Dashboard
          </h1>
          <p className="text-gray-500 dark:text-slate-300">
            Browse doctors, view their schedules, and manage your appointments.
          </p>
        </div>

        {/* List of Doctors */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-slate-50">
            <User className="text-blue-600" size={20} /> Available Doctors
          </h2>
          {doctors.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-300 italic">No doctors available yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {doctors.map((doctor) => (
                <div
                  key={doctor._id}
                  className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white dark:bg-slate-900"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{doctor.email}</p>
                    <p className="text-sm text-gray-600 dark:text-slate-300 italic">
                      {doctor.specialization || "General Practitioner"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBookClick(doctor)}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      View Slots & Book
                    </button>
                    <button
                      onClick={() => setSelectedDoctorForChat({ id: doctor._id, name: doctor.name })}
                      className="px-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition text-sm"
                      title="Chat with doctor"
                    >
                      💬
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wait Time Prediction */}
        {appointments.filter((apt) => apt.status === "waiting" && apt.doctorId).length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-slate-50">
              <Timer className="text-blue-600" size={20} /> Estimated Wait Times
            </h2>
            <div className="space-y-3">
              {appointments
                .filter((apt) => {
                  const doctorId = typeof apt.doctorId === 'object' ? apt.doctorId?._id : apt.doctorId;
                  return apt.status === "waiting" && doctorId;
                })
                .map((apt) => {
                  const doctorId = typeof apt.doctorId === 'object' ? apt.doctorId?._id : apt.doctorId;
                  const waitTime = waitTimes[doctorId] || 0;
                  const position = getPatientQueuePosition(doctorId);
                  const doctorName = apt.doctorId?.name || apt.doctorName || "Doctor";
                  
                  return (
                    <div
                      key={apt._id}
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-slate-50">
                            {doctorName}
                          </p>
                          {position && (
                            <p className="text-sm text-gray-600 dark:text-slate-300">
                              Position in queue: #{position}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {waitTime}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">minutes</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Appointment History */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-slate-50">
            <CalendarDays className="text-blue-600" size={20} /> Appointment
            History
          </h2>
          {appointmentsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-300 italic">
              You don't have any appointments yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {appointments
                .sort((a, b) => {
                  // Sort by scheduled time (most recent first)
                  const timeA = new Date(a.scheduledTime || a.createdAt || 0);
                  const timeB = new Date(b.scheduledTime || b.createdAt || 0);
                  return timeB - timeA;
                })
                .map((apt) => (
                <li
                  key={apt._id}
                  className="flex justify-between items-center py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-50">
                      {apt.doctorId?.name || apt.doctorName || "Dr. Unknown"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {apt.doctorId?.specialization ||
                        apt.doctorSpecialization ||
                        "General"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {new Date(apt.scheduledTime).toLocaleString()}
                    </p>
                    {apt.remarks && (
                      <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText size={12} className="text-blue-600 dark:text-blue-400" />
                          <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                            Doctor's Remarks
                            {apt.remarksAddedAt && (
                              <span className="text-blue-600 dark:text-blue-400 font-normal ml-1">
                                ({new Date(apt.remarksAddedAt).toLocaleDateString()})
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-slate-300">{apt.remarks}</p>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      apt.status === "waiting"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
                        : apt.status === "in_progress"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                        : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
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
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-[90%] max-w-lg shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-50 flex items-center gap-2">
                  <Clock className="text-blue-600" size={20} />
                  {selectedDoctor.name}'s Available Slots
                </h3>
                <button
                  onClick={() => setShowSlotModal(false)}
                  className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {selectedDoctor.availableSlots?.length ? (
                <>
                  {/* Step 1: Select Day */}
                  {!selectedDay && (
                    <div className="mb-5">
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                        Step 1: Choose a day
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {DAYS.map((day) => {
                          const hasSlots = selectedDoctor.availableSlots.some(
                            (slot) => slot.dayOfWeek === day
                          );
                          if (!hasSlots) return null;
                          return (
                            <button
                              key={day}
                              onClick={() => setSelectedDay(day)}
                              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium hover:bg-blue-50 dark:hover:bg-slate-700 transition text-gray-700 dark:text-slate-200"
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Select Time Slot for Selected Day */}
                  {selectedDay && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                          Step 2: Choose a time slot for {selectedDay}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedDay(null);
                            setSelectedSlot(null);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Change day
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {selectedDoctor.availableSlots
                          .filter((slot) => slot.dayOfWeek === selectedDay)
                          .map((slot, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedSlot(slot)}
                              className={`border p-3 rounded-lg text-sm transition ${
                                selectedSlot &&
                                buildSlotKey(selectedSlot) === buildSlotKey(slot)
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "hover:bg-blue-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200"
                              }`}
                            >
                              <span className="block font-medium">{slot.time}</span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500 dark:text-slate-300 text-sm">
                  No available slots for this doctor.
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowSlotModal(false);
                    setSelectedDay(null);
                    setSelectedSlot(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
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

        {/* Chat Window */}
        {selectedDoctorForChat && (
          <ChatWindow
            doctorId={selectedDoctorForChat.id}
            doctorName={selectedDoctorForChat.name}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
