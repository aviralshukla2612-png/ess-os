import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning dummy data...");

  await prisma.activityEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.clientUpdate.deleteMany();
  await prisma.clientPortalToken.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.paymentMilestone.deleteMany();
  await prisma.workSession.deleteMany();
  await prisma.employeeStatusEvent.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.changeRequest.deleteMany();
  await prisma.clientDiscussion.deleteMany();
  await prisma.projectNote.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.projectDocument.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectChecklist.deleteMany();
  await prisma.projectStage.deleteMany();
  await prisma.projectMembership.deleteMany();
  await prisma.project.deleteMany();
  await prisma.projectType.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.leadFollowup.deleteMany();
  await prisma.lead.deleteMany();

  console.log("Dummy data cleaned. Users, roles, employees, and clients are preserved.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
