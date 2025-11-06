import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, PrimaryColumn, ManyToOne } from 'typeorm';
import { User } from './User.js';

@Entity()
export class Expense {
    @PrimaryGeneratedColumn()
    id!: number

    // should this be in expense or expense split? Prob here
    @PrimaryColumn()
    groupId!: number;

    @Column('varchar')
    description!: string;

    @Column('int')
    baseAmount!: number

    @Column('int')
    tax!: number

    @Column('int')
    tip!: number

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    paidByUserId!: User;

    @Column('string')
    split_type!: string

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date
}


@Entity()
export class ExpenseSplit {
    @PrimaryColumn()
    expenseId!: number;

    @PrimaryColumn()
    userId!: number;

    @Column('bool')
    paid!: boolean
}
