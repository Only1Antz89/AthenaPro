import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminAssignmentById } from "@/lib/queries/assignments";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  await requireAdmin();
  const { assignmentId } = await params;
  const assignment = await getAdminAssignmentById(assignmentId);

  if (!assignment) {
    return NextResponse.json({ message: "Assignment not found." }, { status: 404 });
  }

  return NextResponse.json(assignment);
}
