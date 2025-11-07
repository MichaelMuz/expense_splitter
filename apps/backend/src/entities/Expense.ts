import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, PrimaryColumn, ManyToOne } from 'typeorm';
import { User } from './User.js';
import { Group } from './Group.js';

@Entity()
export class Expense {
    @PrimaryGeneratedColumn()
    id!: number

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    paidByUser!: User;

    @ManyToOne(() => Group, { onDelete: 'CASCADE' })
    group!: Group;

    @Column('varchar')
    description!: string;

    @Column('int')
    amount!: number

    @Column('int')
    fee!: number

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date

}


@Entity()
export class ExpenseSplit {
    @PrimaryColumn()
    expenseId!: number;

    @PrimaryColumn()
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
