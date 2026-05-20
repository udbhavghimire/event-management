import Navbar from "@/app/components/Navbar";
import RegisterEventClient from "@/app/components/RegisterEventClient";

export default async function RegisterEventPage({ params }) {
  const { eventId } = await params;
  return (
    <div className="min-h-screen">
      <Navbar />
      <RegisterEventClient eventId={eventId} />
    </div>
  );
}
