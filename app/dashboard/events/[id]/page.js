import Navbar from "@/app/components/Navbar";
import EventFormClient from "@/app/components/EventFormClient";

export default async function EditEventPage({ params }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <Navbar />
      <EventFormClient mode="edit" eventId={id} />
    </div>
  );
}
