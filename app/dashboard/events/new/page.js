import Navbar from "@/app/components/Navbar";
import EventFormClient from "@/app/components/EventFormClient";

export default function NewEventPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <EventFormClient mode="create" />
    </div>
  );
}
