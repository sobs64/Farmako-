import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import DoctorChatWindow from "../components/DoctorChatWindow";
import {
  CalendarDays,
  Clock,
  Trash2,
  Plus,
  ClipboardList,
  Loader2,
} from "lucide-react";

export default function DoctorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState("");
  const [selectedSlots, setSelectedSlots] = useState([]);

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
    if (!user?._id) return;
    try {
      setSchedulesLoading(true);
      const { data } = await API.get(`/schedules/doctor/${user._id}`);
      setSchedules(data.availableSlots || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
      setSchedules([]);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const fetchQueue = async () => {
    if (!user?._id) return;
    try {
      setQueueLoading(true);
      const { data } = await API.get(`/appointments/queue/${user._id}`);
      setQueue(data);
    } catch (err) {
      console.error("Error fetching queue:", err);
      setQueue([]);
    } finally {
      setQueueLoading(false);
    }
  };

  const createSchedule = async () => {
    if (!dayOfWeek || selectedSlots.length === 0) {
      alert("Please select both day and at least one slot");
      return;
    }

    try {
      if (!user?._id) {
        alert("Unable to determine doctor. Please log in again.");
        return;
      }

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
      if (!user?._id) return;
      
      // Delete the slot from the database using POST with delete action
      // (Some axios versions don't support DELETE with body)
      await API.post("/schedules/delete-slot", {
        doctorId: user._id,
        dayOfWeek: slot.dayOfWeek,
        time: slot.time,
      });

      alert("✅ Slot deleted successfully!");
      fetchSchedules();
    } catch (err) {
      console.error("Error deleting slot:", err);
      alert(err.response?.data?.message || "Failed to delete slot");
    }
  };

  useEffect(() => {
    if (!authLoading && user?._id) {
      fetchQueue();
      fetchSchedules();
    }
  }, [authLoading, user?._id]);

  const orderedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      if (a.dayOfWeek === b.dayOfWeek) {
        return a.time.localeCompare(b.time);
      }
      return days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
    });
  }, [schedules]);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50 flex items-center gap-2">
            🩺 Doctor Dashboard
          </h1>
          <p className="text-gray-500 dark:text-slate-300">
            Manage your weekly availability and monitor current patient queue.
          </p>
        </div>

        {/* Add Schedule Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-slate-50">
            <Plus className="text-blue-600" size={20} /> Create New Schedule
          </h2>

          <div className="space-y-4 mb-2">
            {/* Day pills */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
                Pick a day
              </p>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => {
                  const active = dayOfWeek === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setDayOfWeek(day)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time slot chips */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-2 flex items-center gap-1">
                <Clock size={14} className="text-blue-600" />
                Choose time blocks
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {timeOptions.map((time) => {
                  const active = selectedSlots.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleSlotChange(time)}
                      className={`text-xs sm:text-sm px-3 py-2 rounded-xl border transition flex items-center justify-between ${
                        active
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                          : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span>{time}</span>
                      {active && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide opacity-80">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Click to toggle slots on or off for the selected day. You can
                add multiple blocks at once.
              </p>
              <button
                onClick={createSchedule}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-blue-700 transition shadow-sm"
              >
                Save schedule
              </button>
            </div>
          </div>
        </div>

        {/* My Schedules */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-slate-50">
            <CalendarDays className="text-blue-600" size={20} /> My Schedules
          </h2>

          {schedulesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : orderedSchedules.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-300 italic">No schedules created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {orderedSchedules.map((slot, index) => (
                <div
                  key={`${slot.dayOfWeek}-${slot.time}-${index}`}
                  className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 flex justify-between items-center hover:shadow-md transition bg-white dark:bg-slate-900"
                >
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-slate-50">
                      {slot.dayOfWeek}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{slot.time}</p>
                  </div>
                  <button
                    onClick={() => deleteSchedule(slot)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-slate-50">
            <ClipboardList className="text-blue-600" size={20} /> Current Queue
          </h2>
          {queueLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : queue.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-300 italic">
              No patients in queue currently.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {queue.map((patient) => (
                <li
                  key={patient._id}
                  className="flex justify-between items-center py-3"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-50">
                      {patient.patientName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {patient.scheduledTime
                        ? new Date(patient.scheduledTime).toLocaleString()
                        : "Not scheduled"}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      patient.status === "waiting"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300"
                        : patient.status === "in_progress"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                        : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300"
                    }`}
                  >
                    {patient.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Doctor Chat Window */}
        <DoctorChatWindow />
      </div>
    </DashboardLayout>
  );
}
 