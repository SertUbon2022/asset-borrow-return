import React from "react";
import { getCurrentUserSession } from "@/server/actions/auth";
import { getAnnouncements } from "@/server/queries/announcements";
import { redirect } from "next/navigation";
import AdminAnnouncementsClient from "./AdminAnnouncementsClient";

export const revalidate = 0;

export default async function AdminAnnouncementsPage() {
  const session = await getCurrentUserSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  const announcementsList = await getAnnouncements();

  return <AdminAnnouncementsClient initialAnnouncements={announcementsList} />;
}
