import { NextResponse } from "next/server";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, credentials } = body;

    if (!["aws", "vercel", "mock"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    const response = NextResponse.json({ success: true, provider });

    // Always set the provider/mode cookie
    response.cookies.set("aegis_provider", provider, COOKIE_OPTS);

    // Store provider-specific credentials
    if (provider === "aws" && credentials) {
      response.cookies.set(
        "aegis_aws_key_id",
        credentials.accessKeyId ?? "",
        COOKIE_OPTS
      );
      response.cookies.set(
        "aegis_aws_secret",
        credentials.secretAccessKey ?? "",
        COOKIE_OPTS
      );
      response.cookies.set(
        "aegis_aws_region",
        credentials.region ?? "us-east-1",
        COOKIE_OPTS
      );
    }

    if (provider === "vercel" && credentials) {
      response.cookies.set(
        "aegis_vercel_token",
        credentials.apiToken ?? "",
        COOKIE_OPTS
      );
      response.cookies.set(
        "aegis_vercel_team",
        credentials.teamId ?? "",
        COOKIE_OPTS
      );
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });

  const clearOpts = { path: "/", maxAge: 0 };

  const cookiesToClear = [
    "aegis_provider",
    "aegis_aws_key_id",
    "aegis_aws_secret",
    "aegis_aws_region",
    "aegis_vercel_token",
    "aegis_vercel_team",
  ];

  for (const name of cookiesToClear) {
    response.cookies.set(name, "", clearOpts);
  }

  return response;
}