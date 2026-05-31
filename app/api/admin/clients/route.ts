import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminClients } from "@/lib/queries/clients";
import { createClientSchema } from "@/lib/validation/client";

export async function GET() {
  await requireAdmin();
  const clients = await getAdminClients();
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const payload = createClientSchema.parse(body);

  return NextResponse.json(
    {
      message: "Manual client creation should be wired to a privileged server action or route handler.",
      payload
    },
    { status: 202 }
  );
}
