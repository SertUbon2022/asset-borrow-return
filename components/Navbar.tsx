import React, { Suspense } from "react";
import { getCurrentUserSession } from "@/server/actions/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const currentUser = await getCurrentUserSession();

  return (
    <Suspense fallback={<div className="h-16 bg-[#0072BC]" />}>
      <NavbarClient currentUser={currentUser} />
    </Suspense>
  );
}
