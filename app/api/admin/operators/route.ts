import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminOperators } from "@/lib/queries/operators";
import { createOperatorSchema } from "@/lib/validation/operator";

export async function GET() {
  await requireAdmin();
  const operators = await getAdminOperators();
  return NextResponse.json(operators);
}

export async function POST(request: Request) {
  await requireAdmin();
  const body = await request.json();
  const payload = createOperatorSchema.parse(body);

  return NextResponse.json(
    {
      message: "Manual operator creation should be implemented with a privileged write path.",
      payload
    },
    { status: 202 }
  );
}
