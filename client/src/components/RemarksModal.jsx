import { useState, useEffect } from "react";
import { FileText, X, Save, Clock } from "lucide-react";
import API from "../services/api";

export default function RemarksModal({ appointment, isOpen, onClose, onSave }) {
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [previousRemarks, setPreviousRemarks] = useState([]);

  useEffect(() => {
    if (appointment && isOpen) {
      setRemarks(appointment.remarks || "");
      // Fetch previous remarks from other appointments with the same patient
      fetchPreviousRemarks();
    }
  }, [appointment, isOpen]);

  const fetchPreviousRemarks = async () => {
    if (!appointment?.patientId) return;
    try {
      const { data } = await API.get("/appointments/doctor");
      const patientAppointments = data.filter(
        (apt) =>
          apt.patientId === appointment.patientId &&
          apt._id !== appointment._id &&
          apt.remarks &&
          apt.remarks.trim() !== ""
      );
      setPreviousRemarks(
        patientAppointments
          .sort((a, b) => new Date(b.remarksAddedAt || b.createdAt) - new Date(a.remarksAddedAt || a.createdAt))
          .slice(0, 5) // Show last 5 remarks
      );
    } catch (err) {
      console.error("Error fetching previous remarks:", err);
    }
  };

  const handleSave = async () => {
    if (!remarks.trim()) {
      alert("Please enter some remarks before saving.");
      return;
    }

    try {
      setLoading(true);
      await API.patch(`/appointments/${appointment._id}/remarks`, {
        remarks: remarks.trim(),
      });
      if (onSave) onSave();
      onClose();
    } catch (err) {
      console.error("Error saving remarks:", err);
      alert(err.response?.data?.message || "Failed to save remarks");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[90%] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700 bg-blue-600 dark:bg-blue-700">
          <div className="flex items-center gap-2">
            <FileText className="text-white" size={24} />
            <h2 className="text-xl font-semibold text-white">
              Add Remarks for {appointment.patientName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Previous Remarks Section */}
          {previousRemarks.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                <Clock size={16} />
                Previous Remarks
              </h3>
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {previousRemarks.map((apt) => (
                  <div
                    key={apt._id}
                    className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        {apt.remarksAddedAt
                          ? new Date(apt.remarksAddedAt).toLocaleDateString()
                          : new Date(apt.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-300">
                      {apt.remarks}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Remarks Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Session Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter your remarks, observations, recommendations, or notes about this session..."
              className="w-full h-48 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-50 placeholder-gray-400 dark:placeholder-slate-400 resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
              These remarks will be visible to the patient and saved for future reference.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !remarks.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Remarks"}
          </button>
        </div>
      </div>
    </div>
  );
}

