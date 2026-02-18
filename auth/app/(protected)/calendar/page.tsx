import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CalendarClient from "@/components/calendar/calendar-client";

export default async function CalendarPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <CalendarClient />
    </div>
  );
}
