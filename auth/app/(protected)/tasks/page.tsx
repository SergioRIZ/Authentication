import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TasksClient from "@/components/tasks/tasks-client";

export default async function TasksPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <TasksClient />
    </div>
  );
}
