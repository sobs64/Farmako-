import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
