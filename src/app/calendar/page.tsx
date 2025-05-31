"use client";

import MainLayout from "@/components/layout/MainLayout";
import { withAuth } from "@/components/auth/withAuth";
import Calendar from "@/pages/Calendar";

function CalendarPage() {
  return (
    <MainLayout>
      <Calendar />
    </MainLayout>
  );
}

export default withAuth(CalendarPage);
