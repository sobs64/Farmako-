import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white/70 backdrop-blur-md border-b border-gray-200 shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        {/* Logo / Brand */}
        <Link
          to="/"
          className="text-2xl font-extrabold tracking-tight text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Farmako<span className="text-blue-500">+</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <span className="text-gray-700 font-medium">
                👋 Welcome,{" "}
                <span className="text-indigo-600">{user.name}</span>{" "}
                <span className="text-sm text-gray-500">
                  ({user.role === "doctor" ? "Doctor" : "Patient"})
                </span>
              </span>

              {user.role === "patient" && (
                <Link
                  to="/patient/dashboard"
                  className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
              )}

              {user.role === "doctor" && (
                <Link
                  to="/doctor/dashboard"
                  className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
                >
                  Dashboard
                </Link>
              )}

              <Link
                to="/appointments"
                className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                Appointments
              </Link>

              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                Login
              </Link>

              <Link
                to="/signup"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-semibold shadow-md transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
