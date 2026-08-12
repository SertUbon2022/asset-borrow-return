import React from "react";
import { getCurrentUserSession } from "@/server/actions/auth";
import { getCategoriesWithAssetCount } from "@/server/queries/categories";
import { redirect } from "next/navigation";
import AdminCategoriesClient from "./AdminCategoriesClient";

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const session = await getCurrentUserSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  const categoriesList = await getCategoriesWithAssetCount();

  return <AdminCategoriesClient initialCategories={categoriesList} />;
}
