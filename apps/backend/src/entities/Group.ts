import { Entity, PrimaryGeneratedColumn, Column, Generated, CreateDateColumn, PrimaryColumn, ManyToOne } from 'typeorm';
import { User } from './User.js';
@Entity()
export class Group {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('varchar')
    name!: string;

    @Column('varchar', { unique: true })
    @Generated('uuid')
    inviteCode!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date
}

@Entity()
export class GroupMembership {
    @PrimaryColumn()
    userId!: number;

    @PrimaryColumn()
    groupId!: number;

    @Column('varchar')
    role!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    joinedAt!: Date

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user!: User;

    @ManyToOne(() => Group, { onDelete: 'CASCADE' })
    group!: Group;
}
