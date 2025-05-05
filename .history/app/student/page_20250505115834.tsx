import React from "react";
import SidebarStudent from "@/components/SidebarStudent";
import MobileNavigation from "@/components/MobileNavigation";
import Header from "@/components/Header";
import { getCurrentUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";


const currentUser = await getCurrentUser();

if (!currentUser) redirect("/sign-in");
export default function StudentPage() {
    return (
      <main className="flex h-screen">
      <SidebarStudent {...currentUser} />

      <section className="flex h-full flex-1 flex-col">
        <MobileNavigation {...currentUser} />
        <Header userId={currentUser.$id} accountId={currentUser.accountId} />
        <div className="main-content">
          
        </div>
      </section>

      <Toaster />
    </main>
    );
  }
  