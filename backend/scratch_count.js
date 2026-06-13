const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.count();
  const profiles = await prisma.employeeProfile.count();
  const attendances = await prisma.attendance.count();
  const salarySheets = await prisma.salarySheet.count();
  console.log(`DB Count -> Users: ${users}, Profiles: ${profiles}, Attendances: ${attendances}, SalarySheets: ${salarySheets}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
