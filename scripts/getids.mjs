import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const s = await p.studentProfile.findFirst({ where: { chineseName: "李明" } });
const ev = await p.evaluation.findFirst({
  where: { studentId: s.id, assignReAnswer: true },
  orderBy: { createdAt: "desc" },
});
process.stdout.write(JSON.stringify({ studentId: s.id, evaluationId: ev.id }));
await p.$disconnect();
