const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFees() {
  console.log('Seeding Flexible Fees Test Cases...');

  // 1. Create Parent Mr. Siddharth Bhatt
  let parentUser = await prisma.user.findFirst({ where: { name: 'Siddharth Bhatt' } });
  if (!parentUser) {
    parentUser = await prisma.user.create({
      data: {
        name: 'Siddharth Bhatt',
        email: 'siddharth@example.com',
        phone: '9876543210',
        password: 'password123',
        role: 'PARENT',
        regId: 'PAR-2026-001',
      }
    });
  }

  let parent = await prisma.parent.findFirst({ where: { userId: parentUser.id } });
  if (!parent) {
    parent = await prisma.parent.create({
      data: { userId: parentUser.id }
    });
  }

  // Ensure a class exists
  let cls = await prisma.class.findFirst();
  if (!cls) {
    let teacherUser = await prisma.user.findFirst({ where: { role: 'TEACHER' } });
    if (!teacherUser) {
      teacherUser = await prisma.user.create({
        data: { name: 'Demo Teacher', email: 'teacher@demo.com', phone: '123123', password: 'pwd', role: 'TEACHER', regId: 'TCH-001' }
      });
    }
    let teacher = await prisma.teacher.findFirst({ where: { userId: teacherUser.id } });
    if (!teacher) {
      teacher = await prisma.teacher.create({ data: { userId: teacherUser.id, joinDate: new Date() } });
    }
    cls = await prisma.class.create({ data: { name: '10', section: 'A', teacherId: teacher.id } });
  }

  // 2. Create Student A: Aarav Kumar (No Transport)
  let aaravUser = await prisma.user.findFirst({ where: { name: 'Aarav Kumar' } });
  if (!aaravUser) {
    aaravUser = await prisma.user.create({
      data: { name: 'Aarav Kumar', email: 'aarav@example.com', phone: '111', password: 'pwd', role: 'STUDENT', regId: 'STU-2026-001' }
    });
  }
  let aarav = await prisma.student.findFirst({ where: { userId: aaravUser.id } });
  if (!aarav) {
    aarav = await prisma.student.create({
      data: {
        userId: aaravUser.id,
        rollNo: '10A-01',
        classId: cls.id,
        fatherName: 'Siddharth Bhatt',
        motherName: 'Meera Bhatt',
        fatherPhone: '9876543210',
        motherPhone: '9876543211',
        address: 'Delhi',
        dateOfBirth: new Date('2010-01-01'),
        admissionDate: new Date('2020-04-01'),
        parentId: parent.id,
        hasTransport: false,
      }
    });
  } else {
    await prisma.student.update({ where: { id: aarav.id }, data: { parentId: parent.id, hasTransport: false } });
  }

  // 3. Create Student B: Diya Kumar (Transport Zone B)
  let diyaUser = await prisma.user.findFirst({ where: { name: 'Diya Kumar' } });
  if (!diyaUser) {
    diyaUser = await prisma.user.create({
      data: { name: 'Diya Kumar', email: 'diya@example.com', phone: '222', password: 'pwd', role: 'STUDENT', regId: 'STU-2026-002' }
    });
  }
  let diya = await prisma.student.findFirst({ where: { userId: diyaUser.id } });
  if (!diya) {
    diya = await prisma.student.create({
      data: {
        userId: diyaUser.id,
        rollNo: '10A-02',
        classId: cls.id,
        fatherName: 'Siddharth Bhatt',
        motherName: 'Meera Bhatt',
        fatherPhone: '9876543210',
        motherPhone: '9876543211',
        address: 'Delhi',
        dateOfBirth: new Date('2012-01-01'),
        admissionDate: new Date('2020-04-01'),
        parentId: parent.id,
        hasTransport: true,
        transportZone: 'B',
      }
    });
  } else {
    await prisma.student.update({ where: { id: diya.id }, data: { parentId: parent.id, hasTransport: true, transportZone: 'B' } });
  }

  // Clean up existing fees for them
  await prisma.feeRecord.deleteMany({ where: { studentId: { in: [aarav.id, diya.id] } } });
  await prisma.creditWallet.deleteMany({ where: { studentId: { in: [aarav.id, diya.id] } } });

  // 4. Create Invoices for Aarav (No transport)
  await prisma.feeRecord.createMany({
    data: [
      { studentId: aarav.id, feeType: 'Tuition', amount: 18000, dueDate: new Date('2026-04-01'), status: 'OVERDUE' }, // Test Case 3: Overdue by ~2 months
      { studentId: aarav.id, feeType: 'Tuition', amount: 18000, dueDate: new Date('2026-07-01'), status: 'PENDING' },
      { studentId: aarav.id, feeType: 'Computer', amount: 2000, dueDate: new Date('2026-04-01'), status: 'PENDING' },
      { studentId: aarav.id, feeType: 'Library', amount: 1000, dueDate: new Date('2026-04-01'), status: 'PENDING' },
    ]
  });

  // 5. Create Invoices for Diya (With transport)
  await prisma.feeRecord.createMany({
    data: [
      { studentId: diya.id, feeType: 'Tuition', amount: 18000, dueDate: new Date('2026-04-01'), status: 'PENDING' },
      { studentId: diya.id, feeType: 'Transport', amount: 10500, dueDate: new Date('2026-04-01'), status: 'PENDING' }, // Test Case 2: 10,500 transport
      { studentId: diya.id, feeType: 'Library', amount: 1000, dueDate: new Date('2026-04-01'), status: 'PENDING' },
    ]
  });

  // Setup Credit Wallet for Diya
  await prisma.creditWallet.create({
    data: {
      studentId: diya.id,
      balance: 2000,
    }
  });

  console.log('Seeding completed successfully!');
}

seedFees().catch(console.error).finally(() => prisma.$disconnect());
