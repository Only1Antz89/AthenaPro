import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminOperatorById } from "@/lib/queries/operators";

export async function GET(
  _request: Request,
  { params }: { params: { operatorId: string } }
) {
  await requireAdmin();
  const operator = await getAdminOperatorById(params.operatorId);

  if (!operator) {
    return NextResponse.json({ message: "Operator not found." }, { status: 404 });
  }

  return NextResponse.json(operator);
}
