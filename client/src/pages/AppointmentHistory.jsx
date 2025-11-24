import { useEffect, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  Activity,
  Loader2,
} from "lucide-react";

export default function AppointmentHistory() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const groupAppointments = (list) => {
    const now = new Date();
    const upcoming = list.filter(
      (a) => new Date(a.timeSlot) > now && a.status !== "completed"
    );
    const active = list.filter((a) => a.status === "in_progress");
    const past = list.filter(
      (a) => new Date(a.timeSlot) < now || a.status === "completed"
    );
    return { upcoming, active, past };
  };

  const { upcoming, active, past } = groupAppointments(appointments);

  const renderList = (title, icon, color, list) => (
    <div className="mb-8">
      <h2
        className={`text-lg font-semibold mb-4 flex items-center gap-2 ${color}`}
      >
        {icon}
        {title}
      </h2>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
      ) : list.length === 0 ? (
        <p className="text-gray-500 italic">No {title.toLowerCase()} appointments.</p>
      ) : (
        <div className="space-y-4">
          {list.map((appt) => (
            <div
              key={appt._id}
              className="relative pl-6 border-l border-gray-300 hover:border-blue-400 transition"
            >
              <div className="absolute -left-[7px] top-3 w-3 h-3 rounded-full bg-blue-500"></div>
              <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {appt.doctorName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appt.doctorSpecialization || "General"}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Clock size={14} />{" "}
                      {appt.timeSlot
                        ? new Date(appt.timeSlot).toLocaleString()
                        : "Not scheduled"}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-3 py-1 rounded-full ${
                      appt.status === "waiting"
                        ? "bg-yellow-100 text-yellow-700"
                        : appt.status === "in_progress"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {appt.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          📅 Appointment History
        </h1>
        <p className="text-gray-500">
          Track your past, active, and upcoming appointments.
        </p>
      </div>

      {/* Upcoming Appointments */}
      {renderList(
        "Upcoming Appointments",
        <CalendarDays className="text-blue-600" />,
        "text-blue-600",
        upcoming
      )}

      {/* Active Appointments */}
      {renderList(
        "Active Appointments",
        <Activity className="text-indigo-600" />,
        "text-indigo-600",
        active
      )}

      {/* Past Appointments */}
      {renderList(
        "Past Appointments",
        <CheckCircle className="text-green-600" />,
        "text-green-600",
        past
      )}
    </DashboardLayout>
  );
}
