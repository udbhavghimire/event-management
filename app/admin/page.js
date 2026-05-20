import Navbar from "@/app/components/Navbar";
import AdminClient from "@/app/components/AdminClient";

export default function AdminPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <AdminClient />
    </div>
  );
}
