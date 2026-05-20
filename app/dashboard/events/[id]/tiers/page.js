import Navbar from "@/app/components/Navbar";
import TiersClient from "@/app/components/TiersClient";

export default async function TiersPage({ params }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <Navbar />
      <TiersClient eventId={id} />
    </div>
  );
}
