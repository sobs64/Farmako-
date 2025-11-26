import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import {
  CalendarDays,
  Clock,
  Loader2,
  Stethoscope,
  User,
} from "lucide-react";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const sortSlots = (slots) => {
  const parseTime = (timeRange) => {
    if (!timeRange) return 0;
    const start = timeRange.split("-")[0]?.trim();
    if (!start) return 0;
    const [timePart, meridiem] = start.split(" ");
    if (!timePart || !meridiem) return 0;
    let [hours, minutes] = timePart.split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
    const m = meridiem.toUpperCase();
    if (m === "PM" && hours !== 12) hours += 12;
    if (m === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  return [...slots].sort((a, b) => {
    if (a.dayOfWeek === b.dayOfWeek) {
      return parseTime(a.time) - parseTime(b.time);
    }
    return (
      DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
    );
  });
};

export default function Schedule() {
  const { user, loading: authLoading } = useAuth();
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        if (user.role === "doctor") {
          const { data } = await API.get(`/schedules/doctor/${user._id}`);
          setDoctorSlots(data.availableSlots || []);
        } else {
          const { data } = await API.get("/appointments/patient");
          setPatientAppointments(data || []);
        }
      } catch (err) {
        console.error("Error loading schedule:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user]);

  const groupedDoctorSlots = useMemo(() => {
    if (user?.role !== "doctor") return {};
    const groups = {};
    sortSlots(doctorSlots).forEach((slot) => {
      if (!groups[slot.dayOfWeek]) groups[slot.dayOfWeek] = [];
      groups[slot.dayOfWeek].push(slot);
    });
    return groups;
  }, [doctorSlots, user?.role]);

  const groupedPatientSchedule = useMemo(() => {
    if (user?.role !== "patient") return { upcoming: [], past: [] };
    const now = new Date();
    const upcoming = [];
    const past = [];

    patientAppointments.forEach((apt) => {
      const time = apt.scheduledTime ? new Date(apt.scheduledTime) : null;
      if (!time) {
        past.push(apt);
      } else if (time >= now && apt.status !== "completed") {
        upcoming.push(apt);
      } else {
        past.push(apt);
      }
    });

    const sortByTime = (list) =>
      [...list].sort(
        (a, b) =>
          new Date(a.scheduledTime || 0) - new Date(b.scheduledTime || 0)
      );

    return {
      upcoming: sortByTime(upcoming),
      past: sortByTime(past),
    };
  }, [patientAppointments, user?.role]);

  const renderDoctorTimeline = () => {
    const daysWithSlots = DAY_ORDER.filter(
      (day) => groupedDoctorSlots[day]?.length
    );

    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
            Weekly Availability Timeline
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : daysWithSlots.length === 0 ? (
          <p className="text-gray-500 dark:text-slate-300 italic">
            You haven&apos;t published any schedule yet. Create slots from your
            dashboard to see them visualised here.
          </p>
        ) : (
          <div className="space-y-6">
            {daysWithSlots.map((day) => (
              <div key={day} className="flex gap-4 items-stretch">
                {/* Day label + timeline spine */}
                <div className="flex flex-col items-center w-24">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    {day.slice(0, 3)}
                  </span>
                  <div className="flex-1 w-px bg-gradient-to-b from-blue-400/60 to-blue-200/40 dark:from-blue-400/80 dark:to-slate-700 mt-2" />
                </div>

                {/* Time slots line */}
                <div className="flex-1">
                  <div className="relative border border-dashed border-blue-200 dark:border-slate-600 rounded-xl px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {groupedDoctorSlots[day].map((slot, index) => (
                        <div
                          key={`${slot.time}-${index}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200 text-xs font-medium shadow-sm"
                        >
                          <Clock size={14} className="shrink-0" />
                          <span>{slot.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderPatientSchedule = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
              Upcoming visits
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : groupedPatientSchedule.upcoming.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-300 italic">
              You have no upcoming appointments yet. Book a slot from the
              dashboard.
            </p>
          ) : (
            <ul className="space-y-3">
              {groupedPatientSchedule.upcoming.map((apt) => (
                <li
                  key={apt._id}
                  className="border border-gray-100 dark:border-slate-600 rounded-xl px-4 py-3 flex justify-between items-center bg-white dark:bg-slate-800/70"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-slate-50">
                      {apt.doctorId?.name || apt.doctorName || "Dr. Unknown"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {apt.doctorId?.specialization ||
                        apt.doctorSpecialization ||
                        "General"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-slate-200 mt-1">
                      {apt.scheduledTime
                        ? new Date(apt.scheduledTime).toLocaleString()
                        : "Not scheduled"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                    {apt.status.replace("_", " ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
              Past & completed
            </h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : groupedPatientSchedule.past.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-300 italic">
              No past appointments to show yet.
            </p>
          ) : (
            <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {groupedPatientSchedule.past.map((apt) => (
                <li
                  key={apt._id}
                  className="border border-gray-100 dark:border-slate-600 rounded-xl px-4 py-3 bg-slate-50/80 dark:bg-slate-900/60"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-slate-50">
                        {apt.doctorId?.name || apt.doctorName || "Dr. Unknown"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {apt.doctorId?.specialization ||
                          apt.doctorSpecialization ||
                          "General"}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-100">
                      {apt.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-slate-300 mt-2">
                    {apt.scheduledTime
                      ? new Date(apt.scheduledTime).toLocaleString()
                      : "Not scheduled"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  };

  const role = user?.role || "patient";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50 flex items-center gap-2">
              {role === "doctor" ? (
                <>
                  <Stethoscope className="text-blue-600" />
                  My Schedule
                </>
              ) : (
                <>
                  <User className="text-blue-600" />
                  My Visits Schedule
                </>
              )}
            </h1>
            <p className="text-gray-500 dark:text-slate-300">
              {role === "doctor"
                ? "A visual overview of your weekly availability for patients."
                : "See your upcoming visits and a quick glance at your past appointments."}
            </p>
          </div>
        </div>

        {role === "doctor" ? renderDoctorTimeline() : renderPatientSchedule()}
      </div>
    </DashboardLayout>
  );
}


