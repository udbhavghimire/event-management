import Navbar from "@/app/components/Navbar";
import DashboardClient from "@/app/components/DashboardClient";

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <DashboardClient />
    </div>
  );
}
