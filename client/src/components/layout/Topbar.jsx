import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Topbar() {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          👋 Hi, {user?.role === "doctor" ? `Dr. ${user.name}` : user?.name}
        </h1>
        <p className="text-sm text-gray-500">{formattedDate}</p>
      </div>
      <div className="text-gray-700 font-medium">{formattedTime}</div>
    </header>
  );
}
