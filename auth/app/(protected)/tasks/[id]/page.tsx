import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import TaskDetailClient from "@/components/tasks/task-detail-client";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <TaskDetailClient taskId={id} />
    </div>
  );
}
