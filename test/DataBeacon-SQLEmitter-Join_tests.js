/**
 * DataBeacon-SQLEmitter-Join — pure-function tests for the paged JOIN
 * emitter used by SQLAggregate's sibling, SQLJoin.
 *
 * @author Steven Velozo <steven@velozo.com>
 * @license MIT
 */

const libChai = require('chai');
const Expect = libChai.expect;

const { buildJoinPagedSQL, KEYSET_CURSOR_ALIAS } = require('../source/services/DataBeacon-SQLEmitter-Join.js');

const SAMPLE_SPEC =
{
	Table: 'SalesOrderLineMirror',
	RelatedTable: 'SalesOrderMirror',
	JoinOn: { SourceField: 'IDSalesOrder', RelatedField: 'IDSalesOrder' },
	Projection:
	{
		IDSalesOrderLine: '{~D:Record.IDSalesOrderLine~}',
		LineNumber:       '{~D:Record.LineNumber~}',
		ExtendedUSD:      '{~D:Record.ExtendedUSD~}',
		OrderNumber:      '{~D:Related.OrderNumber~}',
		OrderDate:        '{~D:Related.OrderDate~}',
		OrderStatus:      '{~D:Related.Status~}'
	},
	OrderBy: 'IDSalesOrderLine',
	Limit: 500,
	Offset: 0
};

// Spec WITHOUT the OrderBy column in the projection — exercises the
// sentinel-cursor path.
const SAMPLE_SPEC_NO_PK =
{
	Table: 'SalesOrderLineMirror',
	RelatedTable: 'SalesOrderMirror',
	JoinOn: { SourceField: 'IDSalesOrder', RelatedField: 'IDSalesOrder' },
	Projection:
	{
		LineNumber:       '{~D:Record.LineNumber~}',
		ExtendedUSD:      '{~D:Record.ExtendedUSD~}',
		OrderNumber:      '{~D:Related.OrderNumber~}'
	},
	OrderBy: 'IDSalesOrderLine',
	Limit: 500
};

suite('DataBeacon-SQLEmitter-Join', () =>
{
	suite('legacy Offset path — emits dialect-correct paged JOIN SQL', () =>
	{
		test('PostgreSQL', () =>
		{
			let tmpResult = buildJoinPagedSQL('PostgreSQL', SAMPLE_SPEC);
			Expect(tmpResult.SQL).to.equal(
				'SELECT src."IDSalesOrderLine" AS "IDSalesOrderLine", src."LineNumber" AS "LineNumber", src."ExtendedUSD" AS "ExtendedUSD", rel."OrderNumber" AS "OrderNumber", rel."OrderDate" AS "OrderDate", rel."Status" AS "OrderStatus"' +
				' FROM "SalesOrderLineMirror" src INNER JOIN "SalesOrderMirror" rel ON src."IDSalesOrder" = rel."IDSalesOrder"' +
				' ORDER BY src."IDSalesOrderLine" ASC LIMIT 500 OFFSET 0');
			Expect(tmpResult.Params).to.deep.equal([]);
			Expect(tmpResult.CursorField).to.equal(null);
		});

		test('MySQL', () =>
		{
			let tmpResult = buildJoinPagedSQL('MySQL', SAMPLE_SPEC);
			Expect(tmpResult.SQL).to.contain('SELECT src.`IDSalesOrderLine` AS `IDSalesOrderLine`');
			Expect(tmpResult.SQL).to.contain('FROM `SalesOrderLineMirror` src INNER JOIN `SalesOrderMirror` rel');
			Expect(tmpResult.SQL).to.contain('ORDER BY src.`IDSalesOrderLine` ASC LIMIT 500 OFFSET 0');
			Expect(tmpResult.Params).to.deep.equal([]);
		});

		test('SQLite', () =>
		{
			let tmpResult = buildJoinPagedSQL('SQLite', SAMPLE_SPEC);
			Expect(tmpResult.SQL).to.contain('SELECT src."IDSalesOrderLine" AS "IDSalesOrderLine"');
			Expect(tmpResult.SQL).to.contain('LIMIT 500 OFFSET 0');
		});

		test('MSSQL emits OFFSET/FETCH instead of LIMIT', () =>
		{
			let tmpResult = buildJoinPagedSQL('MSSQL', SAMPLE_SPEC);
			Expect(tmpResult.SQL).to.contain('OFFSET 0 ROWS FETCH NEXT 500 ROWS ONLY');
			Expect(tmpResult.SQL).to.not.contain('LIMIT');
		});

		test('OrderBy is honored', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { OrderBy: 'CreateDate' });
			let tmpResult = buildJoinPagedSQL('PostgreSQL', tmpSpec);
			Expect(tmpResult.SQL).to.contain('ORDER BY src."CreateDate" ASC');
		});

		test('OrderBy is required (no defaulting from Table name)', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC); delete tmpSpec.OrderBy;
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/OrderBy is required/);
		});

		test('Limit and Offset propagate', () =>
		{
			let tmpResult = buildJoinPagedSQL('PostgreSQL', Object.assign({}, SAMPLE_SPEC, { Limit: 250, Offset: 1000 }));
			Expect(tmpResult.SQL).to.contain('LIMIT 250 OFFSET 1000');
		});
	});

	suite('keyset (AfterValue) path', () =>
	{
		// First-page emission: AfterValue=null, no WHERE, no OFFSET.
		test('PostgreSQL — first page (AfterValue=null) omits WHERE and OFFSET', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { AfterValue: null });
			delete tmpSpec.Offset;
			let tmpResult = buildJoinPagedSQL('PostgreSQL', tmpSpec);
			Expect(tmpResult.SQL).to.not.contain('WHERE');
			Expect(tmpResult.SQL).to.not.contain('OFFSET');
			Expect(tmpResult.SQL).to.contain('ORDER BY src."IDSalesOrderLine" ASC LIMIT 500');
			Expect(tmpResult.Params).to.deep.equal([]);
			// Projection already includes IDSalesOrderLine — reuse it as cursor.
			Expect(tmpResult.CursorField).to.equal('IDSalesOrderLine');
		});

		test('PostgreSQL — subsequent page emits "$1" parameterized WHERE', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { AfterValue: 12345 });
			delete tmpSpec.Offset;
			let tmpResult = buildJoinPagedSQL('PostgreSQL', tmpSpec);
			Expect(tmpResult.SQL).to.contain('WHERE src."IDSalesOrderLine" > $1');
			Expect(tmpResult.SQL).to.not.contain('OFFSET');
			Expect(tmpResult.SQL).to.contain('ORDER BY src."IDSalesOrderLine" ASC LIMIT 500');
			Expect(tmpResult.Params).to.deep.equal([12345]);
			Expect(tmpResult.CursorField).to.equal('IDSalesOrderLine');
		});

		test('MySQL — subsequent page emits "?" placeholder', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { AfterValue: 99 });
			delete tmpSpec.Offset;
			let tmpResult = buildJoinPagedSQL('MySQL', tmpSpec);
			Expect(tmpResult.SQL).to.contain('WHERE src.`IDSalesOrderLine` > ?');
			Expect(tmpResult.SQL).to.not.contain('OFFSET');
			Expect(tmpResult.Params).to.deep.equal([99]);
		});

		test('SQLite — subsequent page emits "?" placeholder', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { AfterValue: 7 });
			delete tmpSpec.Offset;
			let tmpResult = buildJoinPagedSQL('SQLite', tmpSpec);
			Expect(tmpResult.SQL).to.contain('WHERE src."IDSalesOrderLine" > ?');
			Expect(tmpResult.SQL).to.not.contain('OFFSET');
			Expect(tmpResult.Params).to.deep.equal([7]);
		});

		test('MSSQL — uses SELECT TOP and "@p1" placeholder, never emits OFFSET', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { AfterValue: 1000 });
			delete tmpSpec.Offset;
			let tmpResult = buildJoinPagedSQL('MSSQL', tmpSpec);
			Expect(tmpResult.SQL).to.contain('SELECT TOP 500');
			Expect(tmpResult.SQL).to.contain('WHERE src.[IDSalesOrderLine] > @p1');
			Expect(tmpResult.SQL).to.not.contain('OFFSET');
			Expect(tmpResult.SQL).to.not.contain('FETCH NEXT');
			Expect(tmpResult.Params).to.deep.equal([1000]);
		});

		test('MSSQL — first page (AfterValue=null) emits SELECT TOP without WHERE', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { AfterValue: null });
			delete tmpSpec.Offset;
			let tmpResult = buildJoinPagedSQL('MSSQL', tmpSpec);
			Expect(tmpResult.SQL).to.contain('SELECT TOP 500');
			Expect(tmpResult.SQL).to.not.contain('WHERE');
			Expect(tmpResult.SQL).to.not.contain('OFFSET');
		});

		test('reuses an existing projected cursor field rather than adding the sentinel', () =>
		{
			// SAMPLE_SPEC's projection includes IDSalesOrderLine = {~D:Record.IDSalesOrderLine~}.
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { AfterValue: null });
			delete tmpSpec.Offset;
			let tmpResult = buildJoinPagedSQL('PostgreSQL', tmpSpec);
			Expect(tmpResult.CursorField).to.equal('IDSalesOrderLine');
			Expect(tmpResult.SQL).to.not.contain(KEYSET_CURSOR_ALIAS);
		});

		test('adds a sentinel cursor column when projection omits OrderBy', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC_NO_PK, { AfterValue: null });
			let tmpResult = buildJoinPagedSQL('PostgreSQL', tmpSpec);
			Expect(tmpResult.CursorField).to.equal(KEYSET_CURSOR_ALIAS);
			// Sentinel column appears as the FIRST projected column.
			Expect(tmpResult.SQL).to.match(new RegExp('^SELECT src\\."IDSalesOrderLine" AS "' + KEYSET_CURSOR_ALIAS + '"'));
		});

		test('parameterized WHERE uses the same OrderBy column as the ORDER BY', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { OrderBy: 'CreateDate', AfterValue: '2026-01-01' });
			delete tmpSpec.Offset;
			let tmpResult = buildJoinPagedSQL('PostgreSQL', tmpSpec);
			Expect(tmpResult.SQL).to.contain('WHERE src."CreateDate" > $1');
			Expect(tmpResult.SQL).to.contain('ORDER BY src."CreateDate" ASC');
			Expect(tmpResult.Params).to.deep.equal(['2026-01-01']);
		});

		test('AfterValue and Offset together throw', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { AfterValue: 1, Offset: 100 });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/mutually exclusive/);
		});

		test('rejects projection key collision with the sentinel cursor alias', () =>
		{
			let tmpProjection = Object.assign({}, SAMPLE_SPEC_NO_PK.Projection);
			tmpProjection[KEYSET_CURSOR_ALIAS] = '{~D:Record.LineNumber~}';
			let tmpSpec = Object.assign({}, SAMPLE_SPEC_NO_PK, { Projection: tmpProjection, AfterValue: null });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/reserved for keyset/);
		});

		test('Limit propagates through keyset path', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { AfterValue: 42, Limit: 1000 });
			delete tmpSpec.Offset;
			let tmpResult = buildJoinPagedSQL('PostgreSQL', tmpSpec);
			Expect(tmpResult.SQL).to.contain('LIMIT 1000');
		});
	});

	suite('input validation', () =>
	{
		test('rejects unknown dialect', () =>
		{
			Expect(() => buildJoinPagedSQL('OracleXX', SAMPLE_SPEC)).to.throw(/unsupported dialect/);
		});

		test('rejects missing Table', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC); delete tmpSpec.Table;
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/Table is required/);
		});

		test('rejects missing RelatedTable', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC); delete tmpSpec.RelatedTable;
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/RelatedTable is required/);
		});

		test('rejects injection-bearing Table', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { Table: 'X"; DROP TABLE Y;--' });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/simple identifier/);
		});

		test('rejects missing JoinOn fields', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { JoinOn: { SourceField: 'X' } });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/JoinOn.RelatedField/);
		});

		test('rejects empty Projection', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { Projection: {} });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/Projection is required/);
		});

		test('rejects projection target with non-identifier', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { Projection: { 'bad target': '{~D:Record.X~}' } });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/Projection key/);
		});

		test('rejects projection value that is not Record.X / Related.X', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { Projection: { Computed: 'CONCAT({~D:Record.A~}, {~D:Related.B~})' } });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/exactly "\{~D:Record/);
		});

		test('rejects projection field with injection chars', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { Projection: { Bad: '{~D:Record.X"; DROP--~}' } });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw();
		});

		test('rejects out-of-range Limit', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { Limit: 0 });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/Limit must be/);
		});

		test('rejects negative Offset', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { Offset: -1 });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/Offset must be/);
		});

		test('rejects injection-bearing OrderBy', () =>
		{
			let tmpSpec = Object.assign({}, SAMPLE_SPEC, { OrderBy: 'ok"; DROP--' });
			Expect(() => buildJoinPagedSQL('PostgreSQL', tmpSpec)).to.throw(/OrderBy must be/);
		});
	});
});
