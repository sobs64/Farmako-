import { useState } from "react";
import API from "../api/axios";

export default function QueueStatus({ queue, onUpdate }) {
  const [updating, setUpdating] = useState({});

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      setUpdating({ ...updating, [appointmentId]: true });
      await API.patch(`/appointments/${appointmentId}/status`, {
        status: newStatus,
      });
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdating({ ...updating, [appointmentId]: false });
    }
  };

  return (
    <div className="mt-4">
      <h2 className="font-semibold text-lg mb-2">Current Queue</h2>
      {queue.length === 0 ? (
        <p className="text-gray-500">No patients waiting</p>
      ) : (
        <div className="space-y-2">
          {queue.map((q, i) => (
            <div
              key={q._id || i}
              className="border p-4 rounded bg-white shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-medium">
                  {q.patientId?.name || "Unknown Patient"}
                </p>
                <p className="text-sm text-gray-500">
                  {q.patientId?.email || ""}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Scheduled: {new Date(q.scheduledTime).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    q.status === "waiting"
                      ? "bg-yellow-100 text-yellow-800"
                      : q.status === "in_progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {q.status}
                </span>
                {q.status === "waiting" && (
                  <button
                    onClick={() => handleStatusUpdate(q._id, "in_progress")}
                    disabled={updating[q._id]}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updating[q._id] ? "Updating..." : "Start"}
                  </button>
                )}
                {q.status === "in_progress" && (
                  <button
                    onClick={() => handleStatusUpdate(q._id, "completed")}
                    disabled={updating[q._id]}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {updating[q._id] ? "Updating..." : "Complete"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
