import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminClientById } from "@/lib/queries/clients";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  await requireAdmin();
  const { clientId } = await params;
  const client = await getAdminClientById(clientId);

  if (!client) {
    return NextResponse.json({ message: "Client not found." }, { status: 404 });
  }

  return NextResponse.json(client);
}
