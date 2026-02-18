import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CustomersClient from "@/components/customers/customers-client";

export default async function CustomersPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <CustomersClient />
    </div>
  );
}
