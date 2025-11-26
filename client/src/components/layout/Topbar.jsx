import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

export default function Topbar() {
  const { user } = useAuth();
  const { language } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const locale = language === "es" ? "es-ES" : "en-US";

  const formattedDate = time.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = time.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const greeting =
    language === "es"
      ? `Hola, ${user?.role === "doctor" ? `Dr. ${user?.name}` : user?.name}`
      : `Hi, ${user?.role === "doctor" ? `Dr. ${user?.name}` : user?.name}`;

  return (
    <header className="h-16 bg-white dark:bg-slate-950/70 backdrop-blur-sm shadow-sm flex items-center justify-between px-8 sticky top-0 z-10 border-b border-gray-100 dark:border-slate-800">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
          👋 {greeting}
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-300">
          {formattedDate}
        </p>
      </div>
      <div className="text-gray-700 dark:text-slate-100 font-medium">
        {formattedTime}
      </div>
    </header>
  );
}
