import React from "react";
import { getCurrentUserSession } from "@/server/actions/auth";
import { getUsersList } from "@/server/queries/users";
import { redirect } from "next/navigation";
import AdminUsersClient from "./AdminUsersClient";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const session = await getCurrentUserSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  const usersList = await getUsersList();

  return (
    <AdminUsersClient
      initialUsers={usersList}
      currentUserId={session.id}
    />
  );
}
