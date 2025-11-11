import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, PrimaryColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './User.js';
import { Group } from './Group.js';

@Entity()
export class Expense {
    @PrimaryGeneratedColumn()
    id!: number

    @Column('int')
    paidByUserId!: number;

    @Column('int')
    groupId!: number;

    @Column('varchar')
    description!: string;

    @Column('int')
    amount!: number

    @Column('int')
    fee!: number

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    paidByUser!: User;

    @ManyToOne(() => Group, { onDelete: 'CASCADE' })
    group!: Group;

    @OneToMany(() => ExpenseSplit, expenseSplit => expenseSplit.expense)
    splits!: ExpenseSplit[];
}


@Entity()
export class ExpenseSplit {
    @PrimaryColumn('int')
    expenseId!: number;

    @PrimaryColumn('int')
    userId!: number;

    @Column('int')
    amountOwed!: number

    @Column('bool')
    paid!: boolean

    @ManyToOne(() => Expense, { onDelete: 'CASCADE' })
    expense!: Expense;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user!: User;
}
