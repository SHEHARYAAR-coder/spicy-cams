import { auth } from "../../../lib/auth";
import { redirect } from "next/navigation";
import ProfileContent from "@/components/profile/profile-content";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <ProfileContent />;
}
