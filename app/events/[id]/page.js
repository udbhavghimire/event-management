import Navbar from "@/app/components/Navbar";
import EventDetailClient from "@/app/components/EventDetailClient";

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <Navbar />
      <EventDetailClient eventId={id} />
    </div>
  );
}
