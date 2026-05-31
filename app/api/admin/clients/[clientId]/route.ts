import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminClientById } from "@/lib/queries/clients";

export async function GET(
  _request: Request,
  { params }: { params: { clientId: string } }
) {
  await requireAdmin();
  const client = await getAdminClientById(params.clientId);

  if (!client) {
    return NextResponse.json({ message: "Client not found." }, { status: 404 });
  }

  return NextResponse.json(client);
}
