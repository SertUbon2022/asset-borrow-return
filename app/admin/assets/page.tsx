import React from "react";
import { getCurrentUserSession } from "@/server/actions/auth";
import { getAdminAssetsList } from "@/server/queries/assets";
import { getCategories } from "@/server/queries/borrow";
import { redirect } from "next/navigation";
import AdminAssetsClient from "./AdminAssetsClient";

export const revalidate = 0;

export default async function AdminAssetsPage() {
  const session = await getCurrentUserSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  const [assetsList, categoriesList] = await Promise.all([
    getAdminAssetsList(),
    getCategories(),
  ]);

  return (
    <AdminAssetsClient
      initialAssets={assetsList}
      categoriesList={categoriesList}
    />
  );
}
