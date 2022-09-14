import { sql } from 'drizzle-orm';
import { TableName } from 'drizzle-orm/branded-types';

import { Check, check } from '~/checks';
import { integer, text } from '~/columns';
import { foreignKey } from '~/foreign-keys';
import { Index, index } from '~/indexes';
import { sqliteTable } from '~/table';
import { getTableConflictConstraints } from '~/utils';
import { Equal, Expect } from '../utils';

// const test = sqliteTable({
// 	name: 'test',
// 	noRowId: true,
// 	strict: true,
// }, {
// 	id: integer('id').autoIncrement().primaryKey(),
// });

const test1 = sqliteTable('test1', {
	id: integer('id').autoIncrement().primaryKey(),
});

export const users = sqliteTable(
	'users_table',
	{
		id: integer('id').primaryKey(),
		homeCity: integer('home_city')
			.notNull()
			.references(() => cities.id),
		currentCity: integer('current_city').references(() => cities.id),
		serialNullable: integer('serial1').autoIncrement(),
		serialNotNull: integer('serial2').autoIncrement().notNull(),
		class: text<'A' | 'C'>('class').notNull(),
		subClass: text<'B' | 'D'>('sub_class'),
		age1: integer('age1').notNull(),
		createdAt: integer('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
	},
	(users) => ({
		usersAge1Idx: index('usersAge1Idx', users.class, {
			unique: true,
		}),
		usersAge2Idx: index('usersAge2Idx', users.class),
		uniqueClass: index('uniqueClass', [users.class, users.subClass], {
			unique: true,
			where: sql`${users.class} is not null`,
			order: 'desc',
			nulls: 'last',
			concurrently: true,
			using: sql`btree`,
		}),
		legalAge: check('legalAge', sql`${users.age1} > 18`),
		usersClassFK: foreignKey(() => ({ columns: [users.subClass], foreignColumns: [classes.subClass] })),
		usersClassComplexFK: foreignKey(() => ({
			columns: [users.class, users.subClass],
			foreignColumns: [classes.class, classes.subClass],
		})),
	}),
);

const usersConflictConstraints = getTableConflictConstraints(users);
Expect<
	Equal<{
		usersAge1Idx: Index<TableName<'users_table'>, true>;
		uniqueClass: Index<TableName<'users_table'>, true>;
		legalAge: Check<TableName<'users_table'>>;
	}, typeof usersConflictConstraints>
>();

export const cities = sqliteTable('cities_table', {
	id: integer('id').primaryKey(),
	name: text('name').notNull(),
	population: integer('population').default(0),
}, (cities) => ({
	citiesNameIdx: index('citiesNameIdx', cities.id),
}));

const citiesConflictConstraints = getTableConflictConstraints(cities);
Expect<Equal<{}, typeof citiesConflictConstraints>>();

export const classes = sqliteTable('classes_table', {
	id: integer('id').primaryKey(),
	class: text<'A' | 'C'>('class'),
	subClass: text<'B' | 'D'>('sub_class').notNull(),
});

const classesConflictConstraints = getTableConflictConstraints(classes);
Expect<Equal<{}, typeof classesConflictConstraints>>();
