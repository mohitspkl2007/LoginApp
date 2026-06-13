const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Clearing existing database...');
  // Delete in dependency order
  await prisma.attendance.deleteMany({});
  await prisma.salarySheet.deleteMany({});
  await prisma.leaveApproval.deleteMany({});
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.assetAllocation.deleteMany({});
  await prisma.assetHistory.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.employeeProfile.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.leaveType.deleteMany({});
  await prisma.student.deleteMany({});

  console.log('Database cleared.');

  // 1. Seed Departments (6 requested)
  const departmentsData = [
    { departmentName: 'HR' },
    { departmentName: 'Engineering' },
    { departmentName: 'Sales' },
    { departmentName: 'Finance' },
    { departmentName: 'Operations' },
    { departmentName: 'Marketing' }
  ];

  const depts = [];
  for (const dept of departmentsData) {
    const d = await prisma.department.create({
      data: dept
    });
    depts.push(d);
  }
  console.log(`Seeded ${depts.length} departments.`);

  // 2. Seed Leave Types
  const leaveTypesData = [
    { name: 'Annual Leave', maxDays: 20 },
    { name: 'Sick Leave', maxDays: 10 },
    { name: 'Casual Leave', maxDays: 7 },
    { name: 'Maternity Leave', maxDays: 90 },
    { name: 'Paternity Leave', maxDays: 15 }
  ];

  const leaveTypes = [];
  for (const lt of leaveTypesData) {
    const l = await prisma.leaveType.create({
      data: lt
    });
    leaveTypes.push(l);
  }
  console.log(`Seeded ${leaveTypes.length} leave types.`);

  // 3. Seed Admin and HR Manager
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@hrms.com',
      password: adminPasswordHash,
      role: 'admin',
      isVerified: true
    }
  });
  console.log(`Super Admin user seeded: ${adminUser.email}`);

  const secondAdminPasswordHash = await bcrypt.hash('MohitAdmin@2024', 10);
  const secondAdminUser = await prisma.user.create({
    data: {
      name: 'Mohit Sapkal Admin',
      email: 'mohit.sapkal2007@gmail.com',
      password: secondAdminPasswordHash,
      role: 'admin',
      isVerified: true
    }
  });
  console.log(`Second Admin user seeded: ${secondAdminUser.email}`);

  const hrPasswordHash = await bcrypt.hash('Password@123', 10);
  const hrUser = await prisma.user.create({
    data: {
      name: 'HR Manager',
      email: 'hr@hrms.com',
      password: hrPasswordHash,
      role: 'hr',
      isVerified: true
    }
  });
  console.log(`HR Manager user seeded: ${hrUser.email}`);

  const deptMap = {};
  depts.forEach(d => {
    deptMap[d.departmentName] = d.id;
  });

  // 4. Seed 75 Employees with realistic Indian names
  const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Krishna', 'Rohan', 'Dev', 'Rahul',
    'Amit', 'Rajesh', 'Sanjay', 'Anand', 'Prakash', 'Diya', 'Ananya', 'Ira', 'Kiara', 'Aanya',
    'Aadhya', 'Anika', 'Aaradhya', 'Prisha', 'Saanvi', 'Riya', 'Neha', 'Pooja', 'Sneha', 'Shreya',
    'Tanvi', 'Kavya', 'Priya', 'Aditi', 'Divya', 'Vikram', 'Manish', 'Kunal', 'Abhishek', 'Varun'
  ];

  const lastNames = [
    'Mehta', 'Shah', 'Sharma', 'Gupta', 'Patel', 'Nair', 'Rao', 'Deshmukh', 'Kulkarni', 'Verma',
    'Joshi', 'Reddy', 'Bhat', 'Iyer', 'Prasad', 'Pillai', 'Saxena', 'Kapoor', 'Sen', 'Mishra',
    'Roy', 'Das', 'Dutta', 'Kumar', 'Singh', 'Chaudhury', 'Banerjee', 'Narayanan', 'Pande', 'Gokhale'
  ];

  const employeePasswordHash = await bcrypt.hash('Password@123', 10);
  const seededEmployees = [];

  console.log('Seeding 75 employees...');
  for (let i = 1; i <= 75; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${fName} ${lName}`;
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@hrms.com`;
    const phone = `9${Math.floor(Math.random() * 900000000 + 100000000)}`;
    const address = `${fName}'s Residence, Mumbai, Maharashtra`;

    // Pick department
    const deptNames = ['HR', 'Engineering', 'Sales', 'Finance', 'Operations', 'Marketing'];
    const deptName = deptNames[i % deptNames.length];
    const departmentId = deptMap[deptName];

    // Pick designation
    let designation = 'Staff';
    if (deptName === 'Engineering') {
      const engJobs = ['Software Engineer', 'Senior Software Engineer', 'QA Engineer', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer'];
      designation = engJobs[Math.floor(Math.random() * engJobs.length)];
    } else if (deptName === 'HR') {
      designation = 'HR Associate';
    } else if (deptName === 'Sales') {
      designation = 'Sales Representative';
    } else if (deptName === 'Finance') {
      designation = 'Accountant';
    } else if (deptName === 'Operations') {
      designation = 'Operations Assistant';
    } else if (deptName === 'Marketing') {
      designation = 'Marketing Executive';
    }

    const salary = 35000 + Math.floor(Math.random() * 85000);
    // Joining date: random date in the last 2 years
    const joiningDate = new Date();
    joiningDate.setDate(joiningDate.getDate() - (100 + Math.floor(Math.random() * 600)));

    const role = (i % 12 === 0) ? 'manager' : 'employee';

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        password: employeePasswordHash,
        role,
        isVerified: true
      }
    });

    const profile = await prisma.employeeProfile.create({
      data: {
        userId: user.id,
        departmentId,
        designation,
        phone,
        address,
        salary,
        joiningDate,
        skills: ['Communication', 'MS Office']
      }
    });

    seededEmployees.push({ user, profile });
  }
  console.log(`Seeded ${seededEmployees.length} employee profiles.`);

  // 5. Seed 20+ Assets (Dell, MacBook, chairs, monitors)
  console.log('Seeding assets...');
  const assetTypes = [
    { name: 'Dell Latitude 7420 Laptop', type: 'Laptop' },
    { name: 'MacBook Pro 14"', type: 'Laptop' },
    { name: 'Lenovo ThinkPad', type: 'Laptop' },
    { name: 'Dell 24" Monitor', type: 'Monitor' },
    { name: 'Logitech Wireless Keyboard', type: 'Keyboard' },
    { name: 'Ergonomic Office Chair', type: 'Chair' },
    { name: 'iPhone 14', type: 'Phone' },
    { name: 'HP Monitor 27"', type: 'Monitor' }
  ];

  const assets = [];
  for (let i = 1; i <= 25; i++) {
    const template = assetTypes[i % assetTypes.length];
    const assetCode = `AST-${String(i).padStart(3, '0')}`;
    const purchaseCost = 15000 + Math.floor(Math.random() * 65000);
    
    // First 20 are allocated, rest available
    const isAllocated = i <= 20;
    const status = isAllocated ? 'allocated' : 'available';

    const asset = await prisma.asset.create({
      data: {
        assetCode,
        assetName: template.name,
        assetType: template.type,
        purchaseCost,
        purchaseDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * Math.random()),
        status
      }
    });
    assets.push(asset);

    if (isAllocated) {
      const employee = seededEmployees[i - 1];
      await prisma.assetAllocation.create({
        data: {
          assetId: asset.id,
          employeeId: employee.user.id,
          allocatedById: adminUser.id,
          status: 'allocated'
        }
      });
    }
  }
  console.log(`Seeded ${assets.length} assets.`);

  // 6. Seed 3 Months of Attendance (approx 90 days, only weekdays)
  console.log('Seeding 3 months of attendance (weekdays only) for all employees...');
  const attendanceStatuses = ['Present', 'Present', 'Present', 'Present', 'Present', 'Present', 'Late', 'Present', 'Half-day', 'Absent'];
  
  // Let's gather all weekdays for the last 90 days
  const weekdays = [];
  for (let d = 0; d < 90; d++) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - d);
    checkDate.setHours(0,0,0,0);
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Mon-Fri
      weekdays.push(new Date(checkDate));
    }
  }

  for (const emp of seededEmployees) {
    const dataToCreate = weekdays.map(date => {
      const status = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
      
      let checkInTime = null;
      let checkOutTime = null;
      let workingHours = null;

      if (status !== 'Absent') {
        checkInTime = new Date(date);
        if (status === 'Late') {
          checkInTime.setHours(10, Math.floor(Math.random() * 30), 0, 0);
        } else if (status === 'Half-day') {
          checkInTime.setHours(13, 0, 0, 0);
        } else {
          checkInTime.setHours(9, Math.floor(Math.random() * 15), 0, 0);
        }

        checkOutTime = new Date(date);
        checkOutTime.setHours(18, Math.floor(Math.random() * 15), 0, 0);
        
        const diffMs = checkOutTime - checkInTime;
        workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
      }

      return {
        employeeId: emp.user.id,
        date,
        status,
        checkInTime,
        checkOutTime,
        workingHours,
        location: Math.random() > 0.5 ? 'Office' : 'Home'
      };
    });

    await prisma.attendance.createMany({
      data: dataToCreate
    });
  }
  console.log('Seeded attendance records.');

  // 7. Seed leave requests
  console.log('Seeding leave requests...');
  const leaveStatuses = ['approved', 'rejected', 'pending'];
  for (let i = 0; i < seededEmployees.length; i++) {
    const emp = seededEmployees[i];
    
    // 2 leaves per employee
    const lt1 = leaveTypes[i % leaveTypes.length];
    const start1 = new Date();
    start1.setDate(start1.getDate() - 15);
    const end1 = new Date(start1);
    end1.setDate(end1.getDate() + 2);
    
    const status1 = leaveStatuses[i % leaveStatuses.length];
    
    const request1 = await prisma.leaveRequest.create({
      data: {
        userId: emp.user.id,
        leaveTypeId: lt1.id,
        startDate: start1,
        endDate: end1,
        days: 3,
        reason: 'Family emergency',
        status: status1
      }
    });

    if (status1 !== 'pending') {
      await prisma.leaveApproval.create({
        data: {
          leaveRequestId: request1.id,
          approverId: adminUser.id,
          approverRole: 'admin',
          status: status1,
          comments: 'Processed by admin'
        }
      });
    }
  }
  console.log('Seeded leave requests.');

  // 8. Seed Salary sheets for the last 3 months
  console.log('Seeding salary sheets...');
  const months = ['2026-05', '2026-04', '2026-03'];
  for (const emp of seededEmployees) {
    for (const m of months) {
      const presentDays = 20 + Math.floor(Math.random() * 3);
      const absentDays = Math.floor(Math.random() * 2);
      const lateDays = Math.floor(Math.random() * 3);
      const baseSalary = emp.profile.salary || 50000;
      const pf = baseSalary * 0.12;
      const netSalary = baseSalary - pf - (baseSalary / 30) * absentDays + 2000; // tdc/asic allowances

      await prisma.salarySheet.create({
        data: {
          employeeProfileId: emp.profile.id,
          month: m,
          presentDays,
          absentDays,
          lateDays,
          tdc: 1000,
          asic: 1000,
          pf,
          netSalary: Math.max(0, Math.round(netSalary * 100) / 100)
        }
      });
    }
  }
  console.log('Seeded salary sheets.');

  // 9. Seed some Students (approx 10)
  console.log('Seeding some students...');
  const domains = ['Web Development', 'ASIC Design', 'Data Science', 'Embedded Systems', 'Cybersecurity'];
  const modes = ['online', 'offline', 'hybrid'];
  for (let i = 1; i <= 15; i++) {
    const fName = firstNames[i % firstNames.length];
    const lName = lastNames[i % lastNames.length];
    await prisma.student.create({
      data: {
        name: `${fName} ${lName}`,
        email: `student.${fName.toLowerCase()}${i}@edu.com`,
        semester: `Semester ${1 + (i % 8)}`,
        city: 'Pune',
        domain: domains[i % domains.length],
        mode: modes[i % modes.length]
      }
    });
  }
  console.log('Seeded students.');

  console.log('Database seeding complete!');
}

main()
  .catch(e => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
