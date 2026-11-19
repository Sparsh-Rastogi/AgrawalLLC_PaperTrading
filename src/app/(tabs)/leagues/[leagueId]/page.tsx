import React from "react";
import { LeagueDetailClient } from "./league-detail-client";

export default async function LeagueDetailPage({
  params,
}: {
  params: Promise<{ leagueId: string }>;
}) {
  const { leagueId } = await params;
  return <LeagueDetailClient leagueId={leagueId} />;
}
