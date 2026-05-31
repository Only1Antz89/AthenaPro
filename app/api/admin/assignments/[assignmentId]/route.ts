import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminAssignmentById } from "@/lib/queries/assignments";

export async function GET(
  _request: Request,
  { params }: { params: { assignmentId: string } }
) {
  await requireAdmin();
  const assignment = await getAdminAssignmentById(params.assignmentId);

  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found." }, { status: 404 });
  }

  return NextResponse.json(assignment);
}
