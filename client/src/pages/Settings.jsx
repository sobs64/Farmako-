import DashboardLayout from "../components/layout/DashboardLayout";
import { useTheme } from "../context/ThemeContext";
import { Globe2, Moon, SunMedium } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ka", label: "Kannada" },
  { code: "mr", label: "Espanol" },
];

export default function Settings() {
  const { theme, setTheme, toggleTheme, language, setLanguage } = useTheme();

  const handleThemeChange = (value) => {
    setTheme(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
            Settings
          </h1>
          <p className="text-gray-500 dark:text-slate-300">
            Personalize your dashboard experience.
          </p>
        </div>

        {/* Theme */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 flex items-center gap-2">
                <SunMedium className="text-amber-400" />
                Theme
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-300">
                Switch between light and dark mode for the dashboard.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
                theme === "light"
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                  : "border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
            >
              <SunMedium size={18} />
              Light
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition ${
                theme === "dark"
                  ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                  : "border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
              }`}
            >
              <Moon size={18} />
              Dark
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border border-dashed border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Quick toggle
            </button>
          </div>
        </section>

        {/* Language */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 flex items-center gap-2">
                <Globe2 className="text-blue-600" />
                Language
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-300">
                Choose the language used for labels and text in the app.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {languages.map((lng) => (
              <button
                key={lng.code}
                type="button"
                onClick={() => setLanguage(lng.code)}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition ${
                  language === lng.code
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                    : "border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
                }`}
              >
                {lng.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-gray-400 dark:text-slate-400">
            Language preference is saved on this device. You can extend it to
            more parts of the interface as needed.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}


