import Navbar from "./components/Navbar";
import EventsListClient from "./components/EventsListClient";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <EventsListClient />
    </div>
  );
}
