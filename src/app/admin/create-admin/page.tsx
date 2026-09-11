"use client";

import { PageHeader } from "@/components/app-shell";
import { AdminAccountsList } from "@/components/admin-accounts-list";
import { CreateAdminForm } from "@/components/create-admin-form";

export default function CreateAdminPage() {
  return (
    <div>
      <PageHeader
        title="Create Admin"
        subtitle="Add another admin account with email and password. New admins can sign in at Admin login."
      />

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <h2 className="bg-ember-navy px-4 py-3 text-sm font-semibold text-white">Admins</h2>
        <div className="grid gap-6 p-4 lg:grid-cols-2">
          <AdminAccountsList />
          <CreateAdminForm />
        </div>
      </div>
    </div>
  );
}
