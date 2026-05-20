import Navbar from "@/app/components/Navbar";
import AttendeesClient from "@/app/components/AttendeesClient";

export default async function AttendeesPage({ params }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <Navbar />
      <AttendeesClient eventId={id} />
    </div>
  );
}
