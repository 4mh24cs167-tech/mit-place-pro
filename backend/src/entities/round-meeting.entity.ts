import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn, OneToMany, Index,
} from 'typeorm';
import { Job } from './job.entity';
import { Application } from './application.entity';
import { Student } from './student.entity';

export type MeetingType = 'virtual' | 'group_discussion' | 'one_on_one';
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed';
export type AssignmentStatus = 'assigned' | 'notified' | 'completed';

@Entity('round_meetings')
@Index('idx_round_meetings_job_id', ['jobId'])
@Index('idx_round_meetings_job_round', ['jobId', 'roundNumber'])
export class RoundMeeting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'job_id' })
  jobId: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'smallint', name: 'round_number' })
  roundNumber: number;

  @Column({ type: 'varchar', length: 30, name: 'meeting_type' })
  meetingType: MeetingType;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'meeting_link' })
  meetingLink: string | null;

  @Column({ type: 'date', nullable: true, name: 'scheduled_date' })
  scheduledDate: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'scheduled_time' })
  scheduledTime: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  venue: string | null;

  @Column({ type: 'text', nullable: true })
  instructions: string | null;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: MeetingStatus;

  @OneToMany(() => MeetingGroup, (g) => g.roundMeeting, { cascade: true })
  groups: MeetingGroup[];

  @OneToMany(() => MeetingAssignment, (a) => a.roundMeeting, { cascade: true })
  assignments: MeetingAssignment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('meeting_groups')
@Index('idx_meeting_groups_meeting_id', ['roundMeetingId'])
export class MeetingGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'round_meeting_id' })
  roundMeetingId: string;

  @ManyToOne(() => RoundMeeting, (m) => m.groups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_meeting_id' })
  roundMeeting: RoundMeeting;

  @Column({ type: 'varchar', length: 100, name: 'group_name' })
  groupName: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'meeting_link' })
  meetingLink: string | null;

  @Column({ type: 'date', nullable: true, name: 'scheduled_date' })
  scheduledDate: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'scheduled_time' })
  scheduledTime: string | null;

  @Column({ type: 'int', nullable: true, name: 'max_participants' })
  maxParticipants: number | null;

  @OneToMany(() => MeetingAssignment, (a) => a.meetingGroup)
  assignments: MeetingAssignment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('meeting_assignments')
@Index('idx_meeting_assign_meeting_id', ['roundMeetingId'])
@Index('idx_meeting_assign_student_id', ['studentId'])
@Index('idx_meeting_assign_group_id', ['meetingGroupId'])
export class MeetingAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'round_meeting_id' })
  roundMeetingId: string;

  @ManyToOne(() => RoundMeeting, (m) => m.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'round_meeting_id' })
  roundMeeting: RoundMeeting;

  @Column({ type: 'uuid', nullable: true, name: 'meeting_group_id' })
  meetingGroupId: string | null;

  @ManyToOne(() => MeetingGroup, (g) => g.assignments, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'meeting_group_id' })
  meetingGroup: MeetingGroup | null;

  @Column({ type: 'uuid', name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => Application, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ type: 'uuid', name: 'student_id' })
  studentId: string;

  @ManyToOne(() => Student, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'personal_link' })
  personalLink: string | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'scheduled_start' })
  scheduledStart: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'scheduled_end' })
  scheduledEnd: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'assigned' })
  status: AssignmentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
