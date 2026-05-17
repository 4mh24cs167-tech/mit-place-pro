import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: true,
  logging: false,
});

async function seed() {
  console.log('🌱 Connecting to database...');
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  console.log('✅ Connected!\n');

  // ── Clear existing data (order matters for FK) ──
  console.log('🧹 Clearing existing data...');
  const tables = ['notifications','interview_slots','applications','cvs','jobs','company_availability','students','companies','users'];
  for (const t of tables) {
    await qr.query(`DELETE FROM ${t}`).catch(() => {});
  }

  // ── Helper ──
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  const uuid = () => crypto.randomUUID();

  // ══════════════════════════════════════════════════
  //  1. USERS
  // ══════════════════════════════════════════════════
  console.log('👤 Creating users...');
  const adminId = uuid(), principalId = uuid();
  const companyUserIds = [uuid(), uuid(), uuid()];
  const studentUserIds = Array.from({ length: 15 }, () => uuid());

  await qr.query(`INSERT INTO users (id, email, password_hash, role, must_change_password, is_active) VALUES
    ('${adminId}',    'admin@mitm.edu.in',     '${hash('Admin@123')}',     'admin',     false, true),
    ('${principalId}','principal@mitm.edu.in',  '${hash('Principal@123')}', 'principal', false, true),
    ('${companyUserIds[0]}','hr@infosys.com',   '${hash('Company@123')}',   'company',   false, true),
    ('${companyUserIds[1]}','hr@wipro.com',     '${hash('Company@123')}',   'company',   false, true),
    ('${companyUserIds[2]}','hr@tcs.com',       '${hash('Company@123')}',   'company',   false, true),
    ${studentUserIds.map((id, i) => `('${id}','student${i+1}@mitm.edu.in','${hash('Student@123')}','student',false,true)`).join(',\n    ')}
  `);

  // ══════════════════════════════════════════════════
  //  2. COMPANIES
  // ══════════════════════════════════════════════════
  console.log('🏢 Creating companies...');
  const companyIds = [uuid(), uuid(), uuid()];
  const companies = [
    { id: companyIds[0], userId: companyUserIds[0], name: 'Infosys', sector: 'IT Services', hqCity: 'Bengaluru', website: 'https://infosys.com', hrName: 'Priya Mehta', hrPhone: '9876543210' },
    { id: companyIds[1], userId: companyUserIds[1], name: 'Wipro', sector: 'IT Services', hqCity: 'Bengaluru', website: 'https://wipro.com', hrName: 'Rahul Verma', hrPhone: '9876543211' },
    { id: companyIds[2], userId: companyUserIds[2], name: 'TCS', sector: 'IT Services', hqCity: 'Mumbai', website: 'https://tcs.com', hrName: 'Sneha Reddy', hrPhone: '9876543212' },
  ];
  for (const c of companies) {
    await qr.query(`INSERT INTO companies (id, user_id, name, sector, hq_city, website, hr_name, hr_phone, profile_complete) VALUES ('${c.id}','${c.userId}','${c.name}','${c.sector}','${c.hqCity}','${c.website}','${c.hrName}','${c.hrPhone}',true)`);
  }

  // ══════════════════════════════════════════════════
  //  3. STUDENTS
  // ══════════════════════════════════════════════════
  console.log('🎓 Creating students...');
  const depts = ['CSE','ISE','ECE','ME','CV'];
  const studentNames = ['Arjun Sharma','Priya Patel','Rahul Kumar','Ananya Iyer','Dev Singh','Meera Nair','Karthik Reddy','Sneha Gupta','Vikas Joshi','Pooja Desai','Amit Rao','Divya Kulkarni','Sanjay Hegde','Riya Bhat','Nikhil Gowda'];
  const studentIds: string[] = [];
  const skills = [['Java','Spring Boot','SQL'],['Python','ML','TensorFlow'],['C++','DSA','Linux'],['React','Node.js','MongoDB'],['JavaScript','AWS','Docker']];

  for (let i = 0; i < 15; i++) {
    const sid = uuid();
    studentIds.push(sid);
    const dept = depts[i % 5];
    const usn = `4MT21${dept.slice(0,2)}${String(i+1).padStart(3,'0')}`;
    const cgpa = (6.5 + Math.random() * 3.3).toFixed(2);
    const tenth = (70 + Math.random() * 25).toFixed(2);
    const twelfth = (65 + Math.random() * 30).toFixed(2);
    const backlogs = i < 12 ? 0 : Math.floor(Math.random() * 3);
    const sem = 8;
    const sk = JSON.stringify({ skills: skills[i % 5], linkedin: `https://linkedin.com/in/${studentNames[i].toLowerCase().replace(' ','-')}` });
    const status = i < 3 ? 'placed' : i < 6 ? 'shortlisted' : 'none';

    await qr.query(`INSERT INTO students (id, user_id, usn, full_name, phone, department, semester, cgpa, tenth_percent, twelfth_percent, backlogs, profile_data, profile_complete, placement_status) VALUES ('${sid}','${studentUserIds[i]}','${usn}','${studentNames[i]}','+91 98765 ${String(43210+i).padStart(5,'0')}','${dept}',${sem},${cgpa},${tenth},${twelfth},${backlogs},'${sk}',true,'${status}')`);
  }

  // ══════════════════════════════════════════════════
  //  4. JOBS
  // ══════════════════════════════════════════════════
  console.log('💼 Creating jobs...');
  const jobIds = [uuid(), uuid(), uuid(), uuid()];
  const jobsData = [
    { id: jobIds[0], companyId: companyIds[0], title: 'Software Engineer', desc: 'Full-stack development role at Infosys with focus on Java/Spring Boot microservices.', skills: '{Java,Spring Boot,SQL,REST API}', depts: '{CSE,ISE}', minCgpa: 6.5, ctcMin: 3.6, ctcMax: 4.5, vacancies: 10, rounds: 3, status: 'open' },
    { id: jobIds[1], companyId: companyIds[0], title: 'Systems Engineer', desc: 'Infrastructure and cloud engineering role.', skills: '{AWS,Docker,Linux,Python}', depts: '{CSE,ISE,ECE}', minCgpa: 6.0, ctcMin: 3.2, ctcMax: 3.8, vacancies: 15, rounds: 2, status: 'open' },
    { id: jobIds[2], companyId: companyIds[1], title: 'Project Engineer', desc: 'Full-stack web development role at Wipro Digital.', skills: '{React,Node.js,JavaScript,MongoDB}', depts: '{CSE,ISE}', minCgpa: 7.0, ctcMin: 4.0, ctcMax: 5.5, vacancies: 8, rounds: 3, status: 'open' },
    { id: jobIds[3], companyId: companyIds[2], title: 'Assistant Systems Engineer', desc: 'Entry-level IT consulting role at TCS.', skills: '{Java,Python,SQL}', depts: '{CSE,ISE,ECE,ME,CV}', minCgpa: 6.0, ctcMin: 3.3, ctcMax: 3.6, vacancies: 20, rounds: 2, status: 'open' },
  ];
  for (const j of jobsData) {
    await qr.query(`INSERT INTO jobs (id, company_id, title, description, required_skills, allowed_departments, min_cgpa, ctc_min_lpa, ctc_max_lpa, total_vacancies, num_rounds, status, work_mode, work_location) VALUES ('${j.id}','${j.companyId}','${j.title}','${j.desc}','${j.skills}','${j.depts}',${j.minCgpa},${j.ctcMin},${j.ctcMax},${j.vacancies},${j.rounds},'${j.status}','hybrid','Bengaluru')`);
  }

  // ══════════════════════════════════════════════════
  //  5. APPLICATIONS
  // ══════════════════════════════════════════════════
  console.log('📝 Creating applications...');
  const appIds: string[] = [];
  const appMap: Array<{id:string; studentId:string; jobId:string}> = [];

  // First 10 students apply to Job 1 (Infosys SE)
  for (let i = 0; i < 10; i++) {
    const aid = uuid();
    appIds.push(aid);
    appMap.push({ id: aid, studentId: studentIds[i], jobId: jobIds[0] });
    const matchScore = (60 + Math.random() * 35).toFixed(2);
    const atsScore = (55 + Math.random() * 40).toFixed(2);
    const round = i < 3 ? 3 : i < 6 ? 2 : 1;
    const result = i < 3 ? 'selected' : i >= 8 ? 'rejected' : 'pending';
    const approved = i < 8 ? true : false;

    await qr.query(`INSERT INTO applications (id, student_id, job_id, match_score, ats_score, admin_approved, current_round, final_result) VALUES ('${aid}','${studentIds[i]}','${jobIds[0]}',${matchScore},${atsScore},${approved},${round},'${result}')`);
  }

  // 8 students apply to Job 4 (TCS)
  for (let i = 2; i < 10; i++) {
    const aid = uuid();
    appIds.push(aid);
    appMap.push({ id: aid, studentId: studentIds[i], jobId: jobIds[3] });
    const matchScore = (50 + Math.random() * 40).toFixed(2);
    const atsScore = (50 + Math.random() * 45).toFixed(2);
    const round = i < 5 ? 2 : 1;
    const result = i < 4 ? 'selected' : 'pending';

    await qr.query(`INSERT INTO applications (id, student_id, job_id, match_score, ats_score, admin_approved, current_round, final_result) VALUES ('${aid}','${studentIds[i]}','${jobIds[3]}',${matchScore},${atsScore},true,${round},'${result}')`);
  }

  // 5 students apply to Job 3 (Wipro)
  for (let i = 0; i < 5; i++) {
    const aid = uuid();
    appIds.push(aid);
    const matchScore = (55 + Math.random() * 40).toFixed(2);
    const atsScore = (60 + Math.random() * 35).toFixed(2);
    await qr.query(`INSERT INTO applications (id, student_id, job_id, match_score, ats_score, admin_approved, current_round, final_result) VALUES ('${aid}','${studentIds[i]}','${jobIds[2]}',${matchScore},${atsScore},true,1,'pending')`);
  }

  // ══════════════════════════════════════════════════
  //  6. INTERVIEW SLOTS (for Job 1 applications)
  // ══════════════════════════════════════════════════
  console.log('📅 Creating interview slots...');
  const today = new Date();
  for (let i = 0; i < Math.min(8, appMap.length); i++) {
    const app = appMap[i];
    if (app.jobId !== jobIds[0]) continue;
    for (let r = 1; r <= 2; r++) {
      const slotId = uuid();
      const start = new Date(today);
      start.setDate(start.getDate() - (10 - r * 3) + i);
      start.setHours(9 + i, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      const attendance = 'present';
      const result = i < 3 ? 'selected' : r === 1 ? 'selected' : 'pending';

      await qr.query(`INSERT INTO interview_slots (id, application_id, round_number, scheduled_start, scheduled_end, venue, attendance, round_result) VALUES ('${slotId}','${app.id}',${r},'${start.toISOString()}','${end.toISOString()}','Seminar Hall ${r}','${attendance}','${result}')`);
    }
  }

  // ══════════════════════════════════════════════════
  //  7. NOTIFICATIONS
  // ══════════════════════════════════════════════════
  console.log('🔔 Creating notifications...');
  const notifData = [
    { userId: studentUserIds[0], type: 'placement', title: 'Congratulations! 🎉', body: 'You have been selected by Infosys for the Software Engineer role.' },
    { userId: studentUserIds[1], type: 'placement', title: 'Congratulations! 🎉', body: 'You have been selected by Infosys for the Software Engineer role.' },
    { userId: studentUserIds[3], type: 'interview', title: 'Interview Scheduled', body: 'Your Round 2 interview with Infosys is scheduled for tomorrow at 10:00 AM.' },
    { userId: adminId, type: 'system', title: 'New Company Registered', body: 'TCS has completed their registration and is ready for placement drive.' },
    { userId: studentUserIds[5], type: 'application', title: 'Application Received', body: 'Your application for TCS - Assistant Systems Engineer has been submitted.' },
  ];
  for (const n of notifData) {
    await qr.query(`INSERT INTO notifications (id, user_id, type, title, body, metadata, is_read) VALUES ('${uuid()}','${n.userId}','${n.type}','${n.title}','${n.body}','{}',false)`);
  }

  // ══════════════════════════════════════════════════
  //  SUMMARY
  // ══════════════════════════════════════════════════
  console.log('\n═══════════════════════════════════════');
  console.log('  🌱 SEED DATA COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`  Users:         ${2 + 3 + 15} (1 admin + 1 principal + 3 companies + 15 students)`);
  console.log(`  Companies:     3 (Infosys, Wipro, TCS)`);
  console.log(`  Students:      15 (across 5 departments)`);
  console.log(`  Jobs:          4 (2 Infosys + 1 Wipro + 1 TCS)`);
  console.log(`  Applications:  ${10 + 8 + 5} (across 3 jobs)`);
  console.log(`  Notifications: ${notifData.length}`);
  console.log('═══════════════════════════════════════');
  console.log('\n🔑 LOGIN CREDENTIALS:');
  console.log('  Admin:     admin@mitm.edu.in     / Admin@123');
  console.log('  Principal: principal@mitm.edu.in  / Principal@123');
  console.log('  Company:   hr@infosys.com         / Company@123');
  console.log('  Company:   hr@wipro.com           / Company@123');
  console.log('  Company:   hr@tcs.com             / Company@123');
  console.log('  Student:   student1@mitm.edu.in   / Student@123');
  console.log('  Student:   student2@mitm.edu.in   / Student@123');
  console.log('  (... student3 through student15)');
  console.log('═══════════════════════════════════════\n');

  await AppDataSource.destroy();
  console.log('✅ Done! Database connection closed.');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
