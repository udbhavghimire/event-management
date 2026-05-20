import Navbar from "@/app/components/Navbar";
import AnalyticsClient from "@/app/components/AnalyticsClient";

export default async function AnalyticsPage({ params }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <Navbar />
      <AnalyticsClient eventId={id} />
    </div>
  );
}
