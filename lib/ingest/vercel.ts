interface VercelUsageEntry {
  functionName: string;
  invocations: number;
  gbSeconds: number;
  estimatedCost: number;
}

export async function fetchVercelUsage(): Promise<VercelUsageEntry[]> {
  if (!process.env.VERCEL_API_TOKEN) {
    console.warn("VERCEL_API_TOKEN not set, skipping Vercel usage fetch");
    return [];
  }

  const teamId = process.env.VERCEL_TEAM_ID ?? "";
  const url = `https://api.vercel.com/v1/usage?teamId=${teamId}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}` },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!res.ok) {
    console.error(`Vercel Usage API returned ${res.status}`);
    return [];
  }

  const data = await res.json();

  // Vercel's response shape varies; normalize it
  return (data.functions ?? []).map((fn: any) => ({
    functionName: fn.name ?? fn.path ?? "unknown",
    invocations: fn.invocations ?? 0,
    gbSeconds: fn.gbSeconds ?? 0,
    estimatedCost: (fn.gbSeconds ?? 0) * 0.0000166667, // Vercel pricing
  }));
}