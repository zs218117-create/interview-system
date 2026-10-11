import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessStudent } from "@/lib/access";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const body = await req.json();
  const status = body.status ? String(body.status) : null;
  if (!status || !["PENDING", "IN_PROGRESS", "DONE"].includes(status)) {
    return NextResponse.json({ error: "无效状态" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task) return NextResponse.json({ error: "任务不存在" }, { status: 404 });

  const allowed = await canAccessStudent(session.user, task.studentId);
  // 学生只能改自己被分配的任务
  if (session.user.role === "STUDENT" && task.assigneeId !== session.user.id) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }
  if (!allowed && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  await prisma.task.update({
    where: { id: params.id },
    data: { status },
  });
  return NextResponse.json({ ok: true });
}
