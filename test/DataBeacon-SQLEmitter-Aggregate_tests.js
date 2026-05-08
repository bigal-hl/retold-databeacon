/**
 * DataBeacon-SQLEmitter-Aggregate — pure-function tests.
 *
 * The emitter translates a structured aggregate spec into dialect-specific
 * SQL. These tests cover the happy path per dialect plus every input-
 * validation rejection, since the emitter is the safety boundary between
 * a user-supplied OperationConfiguration and raw SQL hitting the source
 * database pool.
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */

const libChai = require('chai');
const Expect = libChai.expect;

const { buildAggregateSQL, isValidIdentifier } = require('../source/services/DataBeacon-SQLEmitter-Aggregate.js');

suite('DataBeacon-SQLEmitter-Aggregate', () =>
{
	suite('isValidIdentifier', () =>
	{
		test('accepts simple identifiers', () =>
		{
			Expect(isValidIdentifier('Customer')).to.equal(true);
			Expect(isValidIdentifier('IDCustomer')).to.equal(true);
			Expect(isValidIdentifier('snake_case')).to.equal(true);
			Expect(isValidIdentifier('_leading')).to.equal(true);
			Expect(isValidIdentifier('a1')).to.equal(true);
		});

		test('rejects non-identifiers', () =>
		{
			Expect(isValidIdentifier('1leading-digit')).to.equal(false);
			Expect(isValidIdentifier('has space')).to.equal(false);
			Expect(isValidIdentifier('quoted"thing')).to.equal(false);
			Expect(isValidIdentifier('drop;table')).to.equal(false);
			Expect(isValidIdentifier('')).to.equal(false);
			Expect(isValidIdentifier(null)).to.equal(false);
			Expect(isValidIdentifier(42)).to.equal(false);
			Expect(isValidIdentifier('*')).to.equal(false);
		});
	});

	suite('buildAggregateSQL — happy path', () =>
	{
		const tmpSpec =
		{
			Table: 'CustomerMirror',
			GroupBy: ['PaymentTerms'],
			Aggregates:
			[
				{ Source: 'IDCustomer',  Function: 'Count', As: 'CustomerCount' },
				{ Source: 'CreditLimit', Function: 'Sum',   As: 'CreditTotal' }
			]
		};

		test('PostgreSQL emits double-quoted identifiers', () =>
		{
			let tmpSQL = buildAggregateSQL('PostgreSQL', tmpSpec);
			Expect(tmpSQL).to.equal('SELECT "PaymentTerms", COUNT("IDCustomer") AS "CustomerCount", SUM("CreditLimit") AS "CreditTotal" FROM "CustomerMirror" GROUP BY "PaymentTerms"');
		});

		test('MySQL emits backtick-quoted identifiers', () =>
		{
			let tmpSQL = buildAggregateSQL('MySQL', tmpSpec);
			Expect(tmpSQL).to.equal('SELECT `PaymentTerms`, COUNT(`IDCustomer`) AS `CustomerCount`, SUM(`CreditLimit`) AS `CreditTotal` FROM `CustomerMirror` GROUP BY `PaymentTerms`');
		});

		test('SQLite emits double-quoted identifiers', () =>
		{
			let tmpSQL = buildAggregateSQL('SQLite', tmpSpec);
			Expect(tmpSQL).to.equal('SELECT "PaymentTerms", COUNT("IDCustomer") AS "CustomerCount", SUM("CreditLimit") AS "CreditTotal" FROM "CustomerMirror" GROUP BY "PaymentTerms"');
		});

		test('MSSQL emits bracket-quoted identifiers', () =>
		{
			let tmpSQL = buildAggregateSQL('MSSQL', tmpSpec);
			Expect(tmpSQL).to.equal('SELECT [PaymentTerms], COUNT([IDCustomer]) AS [CustomerCount], SUM([CreditLimit]) AS [CreditTotal] FROM [CustomerMirror] GROUP BY [PaymentTerms]');
		});
	});

	suite('buildAggregateSQL — function aliases and shapes', () =>
	{
		test('Mean is an alias for AVG', () =>
		{
			let tmpSQL = buildAggregateSQL('PostgreSQL',
				{
					Table: 'OrderLine',
					GroupBy: ['Status'],
					Aggregates: [ { Source: 'Quantity', Function: 'Mean', As: 'AvgQty' } ]
				});
			Expect(tmpSQL).to.contain('AVG("Quantity") AS "AvgQty"');
			Expect(tmpSQL).to.not.contain('MEAN');
		});

		test('Avg, Min, Max all emit', () =>
		{
			let tmpSQL = buildAggregateSQL('PostgreSQL',
				{
					Table: 'OrderLine',
					GroupBy: ['Status'],
					Aggregates:
					[
						{ Source: 'Quantity', Function: 'Avg', As: 'AvgQty' },
						{ Source: 'Quantity', Function: 'Min', As: 'MinQty' },
						{ Source: 'Quantity', Function: 'Max', As: 'MaxQty' }
					]
				});
			Expect(tmpSQL).to.contain('AVG("Quantity") AS "AvgQty"');
			Expect(tmpSQL).to.contain('MIN("Quantity") AS "MinQty"');
			Expect(tmpSQL).to.contain('MAX("Quantity") AS "MaxQty"');
		});

		test('Count(*) is allowed', () =>
		{
			let tmpSQL = buildAggregateSQL('PostgreSQL',
				{
					Table: 'OrderLine',
					GroupBy: ['Status'],
					Aggregates: [ { Source: '*', Function: 'Count', As: 'RowCount' } ]
				});
			Expect(tmpSQL).to.contain('COUNT(*) AS "RowCount"');
		});

		test('GroupBy is optional (single-row aggregate)', () =>
		{
			let tmpSQL = buildAggregateSQL('PostgreSQL',
				{
					Table: 'OrderLine',
					Aggregates: [ { Source: '*', Function: 'Count', As: 'TotalRows' } ]
				});
			Expect(tmpSQL).to.equal('SELECT COUNT(*) AS "TotalRows" FROM "OrderLine"');
			Expect(tmpSQL).to.not.contain('GROUP BY');
		});

		test('OrderBy is honored', () =>
		{
			let tmpSQL = buildAggregateSQL('PostgreSQL',
				{
					Table: 'OrderLine',
					GroupBy: ['Status'],
					Aggregates: [ { Source: '*', Function: 'Count', As: 'RowCount' } ],
					OrderBy: ['Status']
				});
			Expect(tmpSQL).to.contain('ORDER BY "Status"');
		});

		test('Op is accepted as an alias for Function', () =>
		{
			let tmpSQL = buildAggregateSQL('PostgreSQL',
				{
					Table: 'OrderLine',
					GroupBy: ['Status'],
					Aggregates: [ { Source: 'Quantity', Op: 'Sum', As: 'TotalQty' } ]
				});
			Expect(tmpSQL).to.contain('SUM("Quantity") AS "TotalQty"');
		});

		test('Column is accepted as an alias for Source (existing Aggregation config shape)', () =>
		{
			let tmpSQL = buildAggregateSQL('PostgreSQL',
				{
					Table: 'CustomerMirror',
					GroupBy: ['PaymentTerms'],
					Aggregates:
					[
						{ As: 'CustomerCount',  Op: 'COUNT', Column: '*' },
						{ As: 'TotalCredit',    Op: 'SUM',   Column: 'CreditLimitUSD' }
					]
				});
			Expect(tmpSQL).to.equal('SELECT "PaymentTerms", COUNT(*) AS "CustomerCount", SUM("CreditLimitUSD") AS "TotalCredit" FROM "CustomerMirror" GROUP BY "PaymentTerms"');
		});
	});

	suite('buildAggregateSQL — input validation', () =>
	{
		test('rejects unknown dialect', () =>
		{
			Expect(() => buildAggregateSQL('OracleXX', { Table: 'X', Aggregates: [{ Source: '*', Function: 'Count', As: 'C' }] }))
				.to.throw(/unsupported dialect/);
		});

		test('rejects missing Table', () =>
		{
			Expect(() => buildAggregateSQL('PostgreSQL', { Aggregates: [{ Source: '*', Function: 'Count', As: 'C' }] }))
				.to.throw(/Table is required/);
		});

		test('rejects injection-bearing Table', () =>
		{
			Expect(() => buildAggregateSQL('PostgreSQL',
				{ Table: 'Customer"; DROP TABLE X;--', Aggregates: [{ Source: '*', Function: 'Count', As: 'C' }] }))
				.to.throw(/simple identifier/);
		});

		test('rejects injection-bearing GroupBy', () =>
		{
			Expect(() => buildAggregateSQL('PostgreSQL',
				{
					Table: 'Customer',
					GroupBy: ['ok', 'bad"); DROP--'],
					Aggregates: [{ Source: '*', Function: 'Count', As: 'C' }]
				}))
				.to.throw(/GroupBy\[1\]/);
		});

		test('rejects injection-bearing Aggregate.Source', () =>
		{
			Expect(() => buildAggregateSQL('PostgreSQL',
				{
					Table: 'Customer',
					GroupBy: ['Status'],
					Aggregates: [{ Source: 'Q") FROM X;--', Function: 'Sum', As: 'Total' }]
				}))
				.to.throw(/Aggregates\[0\].Source/);
		});

		test('rejects injection-bearing Aggregate.As', () =>
		{
			Expect(() => buildAggregateSQL('PostgreSQL',
				{
					Table: 'Customer',
					GroupBy: ['Status'],
					Aggregates: [{ Source: 'Q', Function: 'Sum', As: 'Total"; DROP--' }]
				}))
				.to.throw(/Aggregates\[0\].As/);
		});

		test('rejects unknown Function', () =>
		{
			Expect(() => buildAggregateSQL('PostgreSQL',
				{
					Table: 'Customer',
					GroupBy: ['Status'],
					Aggregates: [{ Source: 'Q', Function: 'Median', As: 'Med' }]
				}))
				.to.throw(/Function must be one of/);
		});

		test('rejects empty Aggregates list', () =>
		{
			Expect(() => buildAggregateSQL('PostgreSQL', { Table: 'Customer', Aggregates: [] }))
				.to.throw(/at least one Aggregate/);
		});

		test('rejects Source="*" outside of Count', () =>
		{
			Expect(() => buildAggregateSQL('PostgreSQL',
				{ Table: 'X', Aggregates: [{ Source: '*', Function: 'Sum', As: 'C' }] }))
				.to.throw(/only valid with Function=Count/);
		});

		test('rejects injection-bearing OrderBy', () =>
		{
			Expect(() => buildAggregateSQL('PostgreSQL',
				{
					Table: 'X',
					GroupBy: ['Status'],
					Aggregates: [{ Source: '*', Function: 'Count', As: 'C' }],
					OrderBy: ['ok"; DROP--']
				}))
				.to.throw(/OrderBy\[0\]/);
		});
	});
});
