import { Entity, PrimaryGeneratedColumn, Column, Generated, CreateDateColumn, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('varchar')
    name!: string;

    @Column('varchar', { unique: true })
    email!: string;
}

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
    UserId!: number;

    @PrimaryColumn()
    GroupId!: number;

    @Column('varchar')
    role!: string;

    @CreateDateColumn({ type: 'timestamptz' })
    joinedAt!: Date

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @ManyToOne(() => Group, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'group_id' })
    group!: Group;
}
