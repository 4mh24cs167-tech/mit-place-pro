import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternshipPermission } from '../entities/internship-permission.entity';
import { Student } from '../entities/student.entity';

@Injectable()
export class InternshipService {
  constructor(
    @InjectRepository(InternshipPermission)
    private readonly permissionRepo: Repository<InternshipPermission>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  async submitForm(userId: string, dto: Partial<InternshipPermission>): Promise<InternshipPermission> {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const permission = this.permissionRepo.create({
      ...dto,
      studentId: student.id,
    });

    return this.permissionRepo.save(permission);
  }

  async getStudentForms(userId: string): Promise<InternshipPermission[]> {
    const student = await this.studentRepo.findOne({ where: { userId } });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    return this.permissionRepo.find({
      where: { studentId: student.id },
      order: { createdAt: 'DESC' },
      relations: ['student'],
    });
  }

  async getFormById(id: string): Promise<InternshipPermission> {
    const form = await this.permissionRepo.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!form) {
      throw new NotFoundException('Internship permission form not found');
    }
    return form;
  }

  async listAllForms(): Promise<InternshipPermission[]> {
    return this.permissionRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['student'],
    });
  }
}
