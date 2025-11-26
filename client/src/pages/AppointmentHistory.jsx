import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import RemarksModal from "../components/RemarksModal";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  Activity,
  ClipboardList,
  Loader2,
  FileText,
} from "lucide-react";

const STATUS_BADGE = {
  waiting: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
};

export default function AppointmentHistory() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [remarksModalOpen, setRemarksModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const fetchAppointments = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const endpoint =
        user.role === "doctor" ? "/appointments/doctor" : "/appointments/patient";
      const { data } = await API.get(endpoint);
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchAppointments();
    }
  }, [authLoading, user, fetchAppointments]);

  const groupedAppointments = useMemo(() => {
    const now = new Date();
    
    // Filter appointments by status and sort by real scheduled time
    const pending = appointments
      .filter((apt) => apt.status === "waiting")
      .sort((a, b) => {
        const timeA = new Date(a.scheduledTime || a.createdAt || 0);
        const timeB = new Date(b.scheduledTime || b.createdAt || 0);
        return timeA - timeB; // Earliest first (upcoming appointments)
      });
    
    const active = appointments
      .filter((apt) => apt.status === "in_progress")
      .sort((a, b) => {
        const timeA = new Date(a.scheduledTime || a.createdAt || 0);
        const timeB = new Date(b.scheduledTime || b.createdAt || 0);
        return timeA - timeB; // Earliest first
      });
    
    const completed = appointments
      .filter((apt) => apt.status === "completed")
      .sort((a, b) => {
        const timeA = new Date(a.scheduledTime || a.createdAt || 0);
        const timeB = new Date(b.scheduledTime || b.createdAt || 0);
        return timeB - timeA; // Most recent first (past appointments)
      });
    
    return { pending, active, completed };
  }, [appointments]);

  const handleStatusChange = async (appointmentId, status) => {
    try {
      setActionLoading((prev) => ({ ...prev, [appointmentId]: true }));
      await API.patch(`/appointments/${appointmentId}/status`, { status });
      await fetchAppointments();
    } catch (err) {
      console.error("Error updating appointment:", err);
      alert(err.response?.data?.message || "Failed to update appointment");
    } finally {
      setActionLoading((prev) => ({ ...prev, [appointmentId]: false }));
    }
  };

  const renderAppointmentCard = (appointment, role) => {
    const primaryLabel =
      role === "doctor" ? appointment.patientName : appointment.doctorName;
    const secondaryLabel =
      role === "doctor"
        ? appointment.patientEmail
        : appointment.doctorSpecialization || "General";
    return (
      <div
        key={appointment._id}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-slate-700 hover:shadow-md transition flex flex-col gap-3"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-gray-900 dark:text-slate-50">{primaryLabel}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">{secondaryLabel}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <Clock size={14} />
              {appointment.scheduledTime
                ? new Date(appointment.scheduledTime).toLocaleString()
                : "Not scheduled"}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${
              STATUS_BADGE[appointment.status]
            }`}
          >
            {appointment.status.replace("_", " ")}
          </span>
        </div>

        {role === "doctor" && (
          <div className="flex gap-2 flex-wrap">
            {appointment.status === "waiting" && (
              <button
                onClick={() => handleStatusChange(appointment._id, "in_progress")}
                disabled={actionLoading[appointment._id]}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {actionLoading[appointment._id] ? "Updating..." : "Start Session"}
              </button>
            )}
            {appointment.status === "in_progress" && (
              <>
                <button
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setRemarksModalOpen(true);
                  }}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 transition flex items-center gap-2 dark:bg-purple-500 dark:hover:bg-purple-600"
                >
                  <FileText size={16} />
                  Add Remarks
                </button>
                <button
                  onClick={() => handleStatusChange(appointment._id, "completed")}
                  disabled={actionLoading[appointment._id]}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  {actionLoading[appointment._id] ? "Updating..." : "Complete Session"}
                </button>
              </>
            )}
            {(appointment.status === "completed" || appointment.status === "in_progress") && appointment.remarks && (
              <div className="w-full mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className="text-blue-600 dark:text-blue-400" />
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    Remarks
                    {appointment.remarksAddedAt && (
                      <span className="text-blue-600 dark:text-blue-400 font-normal ml-2">
                        ({new Date(appointment.remarksAddedAt).toLocaleDateString()})
                      </span>
                    )}
                  </p>
                </div>
                <p className="text-sm text-gray-700 dark:text-slate-300">{appointment.remarks}</p>
              </div>
            )}
          </div>
        )}
        {role === "patient" && appointment.remarks && (
          <div className="w-full mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-blue-600 dark:text-blue-400" />
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                Doctor's Remarks
                {appointment.remarksAddedAt && (
                  <span className="text-blue-600 dark:text-blue-400 font-normal ml-2">
                    ({new Date(appointment.remarksAddedAt).toLocaleDateString()})
                  </span>
                )}
              </p>
            </div>
            <p className="text-sm text-gray-700 dark:text-slate-300">{appointment.remarks}</p>
          </div>
        )}
      </div>
    );
  };

  const renderSection = (title, icon, color, list, role, emptyMessage) => (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className={`text-xl font-semibold ${color} dark:text-slate-50`}>{title}</h2>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
      ) : list.length === 0 ? (
        <p className="text-gray-500 dark:text-slate-300 italic">{emptyMessage}</p>
      ) : (
        <div className="grid gap-4">
          {list.map((appointment) => renderAppointmentCard(appointment, role))}
        </div>
      )}
    </section>
  );

  const role = user?.role || "patient";

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50 flex items-center gap-2">
          <ClipboardList className="text-blue-600" />
          Appointment Workflow
        </h1>
        <p className="text-gray-500 dark:text-slate-300">
          {role === "doctor"
            ? "Manage your pending, active, and past appointments."
            : "Track the status of your appointments with every doctor."}
        </p>
      </div>

      {renderSection(
        role === "doctor" ? "Pending Patients" : "Upcoming Appointments",
        <CalendarDays className="text-blue-600" />,
        "text-blue-600",
        groupedAppointments.pending,
        role,
        role === "doctor"
          ? "No patients are waiting right now."
          : "You have no upcoming appointments."
      )}

      {renderSection(
        role === "doctor" ? "Active Sessions" : "In-progress Sessions",
        <Activity className="text-indigo-600" />,
        "text-indigo-600",
        groupedAppointments.active,
        role,
        role === "doctor"
          ? "You have no ongoing sessions."
          : "You have no active appointments right now."
      )}

      {renderSection(
        "Completed Appointments",
        <CheckCircle className="text-green-600" />,
        "text-green-600",
        groupedAppointments.completed,
        role,
        "No completed appointments yet."
      )}

      {/* Remarks Modal */}
      <RemarksModal
        appointment={selectedAppointment}
        isOpen={remarksModalOpen}
        onClose={() => {
          setRemarksModalOpen(false);
          setSelectedAppointment(null);
        }}
        onSave={() => {
          fetchAppointments();
        }}
      />
    </DashboardLayout>
  );
}
