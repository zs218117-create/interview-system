import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  await prisma.reAnswer.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.observation.deleteMany();
  await prisma.interviewRecord.deleteMany();
  await prisma.interviewQuestion.deleteMany();
  await prisma.interviewTutor.deleteMany();
  await prisma.interviewSession.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.externalLesson.deleteMany();
  await prisma.task.deleteMany();
  await prisma.document.deleteMany();
  await prisma.question.deleteMany();
  await prisma.tutorStudentAssignment.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: { email: "admin@demo.com", passwordHash, name: "系统管理员", role: "ADMIN" },
  });

  const tutor1 = await prisma.user.create({
    data: { email: "tutor@demo.com", passwordHash, name: "陈老师", role: "TUTOR" },
  });

  const tutor2 = await prisma.user.create({
    data: { email: "tutor2@demo.com", passwordHash, name: "王老师", role: "TUTOR" },
  });

  const ta = await prisma.user.create({
    data: { email: "ta@demo.com", passwordHash, name: "助教小周", role: "TA" },
  });

  const studentUser = await prisma.user.create({
    data: { email: "student@demo.com", passwordHash, name: "李明", role: "STUDENT" },
  });

  const student2User = await prisma.user.create({
    data: { email: "student2@demo.com", passwordHash, name: "张华", role: "STUDENT" },
  });

  const liMing = await prisma.studentProfile.create({
    data: {
      userId: studentUser.id,
      chineseName: "李明",
      englishName: "Ming Li",
      targetSchool: "牛津大学",
      targetCourse: "工程科学 Engineering Science",
      grade: "A2",
      phone: "13800000001",
      notes: "偏重数学与物理建模，需加强口述表达。",
    },
  });

  const zhangHua = await prisma.studentProfile.create({
    data: {
      userId: student2User.id,
      chineseName: "张华",
      englishName: "Hua Zhang",
      targetSchool: "剑桥大学",
      targetCourse: "自然科学 Natural Sciences",
      grade: "A2",
    },
  });

  await prisma.tutorStudentAssignment.createMany({
    data: [
      { tutorId: tutor1.id, studentId: liMing.id, roleNote: "主导师" },
      { tutorId: tutor2.id, studentId: liMing.id, roleNote: "数学导师" },
      { taId: ta.id, studentId: liMing.id, roleNote: "跟进助教" },
      { tutorId: tutor1.id, studentId: zhangHua.id, roleNote: "主导师" },
      { taId: ta.id, studentId: zhangHua.id, roleNote: "跟进助教" },
    ],
  });

  const q1 = await prisma.question.create({
    data: {
      title: "导数与切线",
      content: "已知 f(x)=x³−3x，求在 x=1 处的切线方程，并说明斜率的几何意义。",
      subject: "数学",
      difficulty: "B",
      createdById: tutor1.id,
      isTemplate: true,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      title: "受力分析",
      content: "光滑斜面上放一物块，用水平力 F 推物块使其匀速上升。请画出受力图并推导 F 与倾角、重力的关系。",
      subject: "物理",
      difficulty: "B",
      createdById: tutor1.id,
      isTemplate: true,
    },
  });

  const interview = await prisma.interviewSession.create({
    data: {
      studentId: liMing.id,
      title: "李明 · 个性化数学面试 #1",
      scheduledAt: new Date("2026-10-15T15:00:00+08:00"),
      durationMin: 30,
      meetingUrl: "https://meeting.tencent.com/dm/demo-liming-001",
      status: "SCHEDULED",
      notes: "常规 20 分钟 + 个性化 10 分钟",
      tutors: {
        create: [{ tutorId: tutor1.id }, { tutorId: tutor2.id }],
      },
      questions: {
        create: [
          { questionId: q1.id, orderIndex: 1 },
          { questionId: q2.id, orderIndex: 2 },
        ],
      },
    },
  });


  // 示例：已完成的一场评价 + 再次回答（便于演示对比）
  const completedInterview = await prisma.interviewSession.create({
    data: {
      studentId: liMing.id,
      title: "李明 · 数学面试（已完成示例）",
      scheduledAt: new Date("2026-10-05T15:00:00+08:00"),
      durationMin: 30,
      meetingUrl: "https://meeting.tencent.com/dm/demo-liming-done",
      status: "COMPLETED",
      notes: "用于演示评价→再答→对比",
      tutors: { create: [{ tutorId: tutor1.id }] },
      questions: { create: [{ questionId: q1.id, orderIndex: 1 }] },
    },
  });

  const sampleEvaluation = await prisma.evaluation.create({
    data: {
      interviewId: completedInterview.id,
      studentId: liMing.id,
      tutorId: tutor1.id,
      questionId: q1.id,
      content: "整体能写出导数，但切线方程符号易错；提示后能纠正。可教性不错。",
      strengths: "计算步骤清楚，愿意接受提示。",
      improvements: "请重新完整写出切线方程，并说明斜率几何意义；注意 f'(1) 的符号。",
      originalAnswerNotes: "首次口头答：f'(x)=3x²-3，代入 x=1 得 0，却写成 y=2(x-1)。未主动解释几何意义。",
      scoreHint: "可教性较好",
      assignReAnswer: true,
      compareNotes: null,
    },
  });

  await prisma.reAnswer.create({
    data: {
      evaluationId: sampleEvaluation.id,
      questionId: q1.id,
      studentId: studentUser.id,
      content:
        "f(x)=x³−3x，f'(x)=3x²−3，故 f'(1)=0。切线方程为 y−f(1)=0·(x−1)，即 y=−2。\n斜率 f'(1)=0 表示该点切线水平，函数在 x=1 处瞬时变化率为 0。",
      submittedAt: new Date("2026-10-07T21:00:00+08:00"),
    },
  });

  await prisma.task.create({
    data: {
      studentId: liMing.id,
      createdById: tutor1.id,
      assigneeId: studentUser.id,
      title: "再次回答：导数与切线",
      description: "请按陈老师反馈重写切线方程与几何意义。",
      status: "DONE",
      dueDate: new Date("2026-10-08T23:59:00+08:00"),
    },
  });

  await prisma.observation.createMany({
    data: [
      {
        studentId: liMing.id,
        tutorId: tutor1.id,
        content: "思路清晰，但遇到提示后需要更主动追问「为什么」而不是等下一步。",
      },
      {
        studentId: liMing.id,
        tutorId: tutor2.id,
        content: "代数变形熟练，图像直觉偏弱，建议加 Graph Sketching 练习。",
      },
    ],
  });

  await prisma.task.create({
    data: {
      studentId: liMing.id,
      createdById: ta.id,
      assigneeId: studentUser.id,
      title: "完成文书第二稿修改",
      description: "按陈老师反馈改个人陈述第 2、3 段。",
      status: "PENDING",
      dueDate: new Date("2026-10-18T23:59:00+08:00"),
    },
  });

  await prisma.journalEntry.create({
    data: {
      studentId: liMing.id,
      authorId: studentUser.id,
      content: "今天练习了受力分析，明白了「正交分解」要先定坐标系。",
      date: new Date("2026-10-10T20:00:00+08:00"),
    },
  });

  await prisma.externalLesson.create({
    data: {
      studentId: liMing.id,
      createdById: ta.id,
      title: "校外数学冲刺课 · 微积分",
      provider: "某培训机构",
      date: new Date("2026-10-08T14:00:00+08:00"),
      content: "覆盖链式法则与隐函数求导，学生反馈尚可。",
    },
  });

  console.log("种子数据写入完成");
  console.log("演示账号（密码均为 Demo1234!）：");
  console.log("  student@demo.com  — 学生 李明");
  console.log("  tutor@demo.com    — 导师 陈老师");
  console.log("  tutor2@demo.com   — 导师 王老师");
  console.log("  ta@demo.com       — 助教 小周");
  console.log("  admin@demo.com    — 管理员");
  console.log("面试 ID:", interview.id);
  console.log("示例评价 ID:", sampleEvaluation.id);
  console.log("管理员 ID:", admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
