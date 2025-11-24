export default function DoctorCard({ doctor, onBook }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transform transition-all duration-300 border border-gray-100 p-6 w-full max-w-sm">
      <div className="flex flex-col items-start">
        <h3 className="text-xl font-semibold text-gray-900 tracking-tight">
          {doctor.name}
        </h3>

        {doctor.specialization && (
          <p className="text-blue-600 font-medium mt-1">
            {doctor.specialization}
          </p>
        )}

        {doctor.email && (
          <p className="text-sm text-gray-500 mt-1">{doctor.email}</p>
        )}

        <div className="mt-6 w-full">
          <button
            onClick={() => onBook(doctor)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium py-2.5 rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-300 transition-all"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
}
