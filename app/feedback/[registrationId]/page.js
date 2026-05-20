import Navbar from "@/app/components/Navbar";
import FeedbackClient from "@/app/components/FeedbackClient";

export default async function FeedbackPage({ params }) {
  const { registrationId } = await params;
  return (
    <div className="min-h-screen">
      <Navbar />
      <FeedbackClient registrationId={registrationId} />
    </div>
  );
}
