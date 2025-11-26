import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  ClipboardList,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const dashboardPath = user?.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard";
    return [
      { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: dashboardPath },
      { name: "Appointments", icon: <CalendarDays size={20} />, path: "/appointments" },
      { name: "Schedule", icon: <Clock size={20} />, path: "/schedule" },
      { name: "History", icon: <ClipboardList size={20} />, path: "/history" },
      { name: "Settings", icon: <Settings size={20} />, path: "/settings" },
    ];
  };

  const menuItems = getMenuItems();

  const getInitials = (name) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "U";

  return (
    <div className="w-64 h-screen fixed left-0 top-0 bg-white dark:bg-slate-900 shadow-lg flex flex-col justify-between border-r border-gray-100 dark:border-slate-800">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-10">
          <span className="text-2xl font-bold text-gray-900 dark:text-slate-50">
            Farmako
          </span>
          <span className="text-2xl font-bold text-blue-500">+</span>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-xl transition-all ${
                  isActive
                    ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-500/10 dark:text-blue-200"
                    : "text-gray-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-300"
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Avatar + Logout */}
      <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
            {getInitials(user?.name || "User")}
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          className="text-gray-500 hover:text-red-600 transition"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
