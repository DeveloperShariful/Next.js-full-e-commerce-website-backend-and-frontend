//app/(backend)/admin/affiliate/_components/Management/partners-manager.tsx

"use client";

import AffiliateUsersTable from "./users-table";

interface Props {
  usersData: any[];
  totalEntries: number;
  totalPages: number;
  currentPage: number;
  tags: any[];
  defaultRate?: number;
  defaultType?: "PERCENTAGE" | "FIXED";
}

export default function PartnersManager({
  usersData,
  totalEntries,
  totalPages,
  currentPage,
  tags,
  defaultRate,
  defaultType
}: Props) {
  return (
    <AffiliateUsersTable
      data={usersData}
      totalEntries={totalEntries}
      totalPages={totalPages}
      currentPage={currentPage}
      tags={tags}
      defaultRate={defaultRate}
      defaultType={defaultType}
    />
  );
}
