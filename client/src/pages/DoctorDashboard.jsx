import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import {
  CalendarDays,
  Clock,
  Trash2,
  Plus,
  ClipboardList,
  Loader2,
} from "lucide-react";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeOptions = [
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 01:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
  ];

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const fetchSchedules = async () => {
    try {
      const { data } = await API.get(`/schedules/doctor/${user._id}`);
      setSchedules(data.availableSlots || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
  };

  const fetchQueue = async () => {
    try {
      const { data } = await API.get(`/appointments/queue/${user._id}`);
      setQueue(data);
    } catch (err) {
      console.error("Error fetching queue:", err);
    } finally {
      setLoading(false);
    }
  };

  const createSchedule = async () => {
    if (!dayOfWeek || selectedSlots.length === 0) {
      alert("Please select both day and at least one slot");
      return;
    }

    try {
      await API.post("/schedules", {
        doctorId: user._id,
        dayOfWeek,
        availableSlots: selectedSlots,
      });
      alert("✅ Schedule added successfully!");
      setDayOfWeek("");
      setSelectedSlots([]);
      fetchSchedules();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create schedule");
    }
  };

  const deleteSchedule = async (slot) => {
    if (!window.confirm("Delete this slot?")) return;
    try {
      const schedulesData = await API.get(`/schedules/doctor/${user._id}`);
      const all = schedulesData.data.availableSlots.filter(
        (s) => !(s.dayOfWeek === slot.dayOfWeek && s.time === slot.time)
      );

      await API.post("/schedules", {
        doctorId: user._id,
        dayOfWeek: slot.dayOfWeek,
        availableSlots: all
          .filter((s) => s.dayOfWeek === slot.dayOfWeek)
          .map((s) => s.time),
      });

      fetchSchedules();
    } catch (err) {
      console.error("Error deleting slot:", err);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchSchedules();
  }, []);

  const handleSlotChange = (time) => {
    setSelectedSlots((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            🩺 Doctor Dashboard
          </h1>
          <p className="text-gray-500">
            Manage your weekly availability and monitor current patient queue.
          </p>
        </div>

        {/* Add Schedule Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <Plus className="text-blue-600" size={20} /> Create New Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Day Dropdown */}
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Day</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>

            {/* Time Slot Multi-Select */}
            <div className="border rounded-lg p-2 h-40 overflow-y-auto">
              {timeOptions.map((time) => (
                <label
                  key={time}
                  className="flex items-center gap-2 text-gray-700 mb-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSlots.includes(time)}
                    onChange={() => handleSlotChange(time)}
                  />
                  {time}
                </label>
              ))}
            </div>

            <button
              onClick={createSchedule}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition self-start"
            >
              Add Schedule
            </button>
          </div>

          <p className="text-sm text-gray-500">
            Select one or more time slots for the chosen day.
          </p>
        </div>

        {/* My Schedules */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <CalendarDays className="text-blue-600" size={20} /> My Schedules
          </h2>

          {schedules.length === 0 ? (
            <p className="text-gray-500 italic">No schedules created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {schedules.map((slot, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {slot.dayOfWeek}
                    </p>
                    <p className="text-sm text-gray-500">{slot.time}</p>
                  </div>
                  <button
                    onClick={() => deleteSchedule(slot)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue Section */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
            <ClipboardList className="text-blue-600" size={20} /> Current Queue
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : queue.length === 0 ? (
            <p className="text-gray-500 italic">
              No patients in queue currently.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {queue.map((patient) => (
                <li
                  key={patient._id}
                  className="flex justify-between items-center py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {patient.patientName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {patient.scheduledTime}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      patient.status === "waiting"
                        ? "bg-yellow-100 text-yellow-700"
                        : patient.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {patient.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
 