import Navbar from "@/app/components/Navbar";
import AgendaClient from "@/app/components/AgendaClient";

export default async function AgendaPage({ params }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <Navbar />
      <AgendaClient eventId={id} />
    </div>
  );
}
