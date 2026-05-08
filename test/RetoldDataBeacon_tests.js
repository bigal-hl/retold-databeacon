/**
 * Retold DataBeacon — Test Suite
 *
 * @author Steven Velozo <steven@velozo.com>
 */
const libAssert = require('assert');
const libSuperTest = require('supertest');

const libPict = require('pict');
const libMeadowConnectionManager = require('meadow-connection-manager');
const libRetoldDataBeacon = require('../source/Retold-DataBeacon.js');

const libPath = require('path');
const libFs = require('fs');

// Test database path
const TEST_DB_PATH = libPath.join(__dirname, '..', 'data', 'test-databeacon.sqlite');

suite
(
	'Retold DataBeacon',
	function ()
	{
		let _Fable = null;
		let _DataBeacon = null;
		let _Server = null;

		suiteSetup
		(
			function (fDone)
			{
				// Ensure test data directory exists
				let tmpDataDir = libPath.dirname(TEST_DB_PATH);
				if (!libFs.existsSync(tmpDataDir))
				{
					libFs.mkdirSync(tmpDataDir, { recursive: true });
				}

				// Clean up old test database
				if (libFs.existsSync(TEST_DB_PATH))
				{
					libFs.unlinkSync(TEST_DB_PATH);
				}

				_Fable = new libPict(
					{
						Product: 'RetoldDataBeaconTest',
						ProductVersion: '0.0.1',
						APIServerPort: 18389,
						LogStreams: [{ streamtype: 'console', level: 'warn' }],
						SQLite: { SQLiteFilePath: TEST_DB_PATH }
					});

				_Fable.serviceManager.addServiceType('MeadowConnectionManager', libMeadowConnectionManager);
				_Fable.serviceManager.instantiateServiceProvider('MeadowConnectionManager');

				_Fable.MeadowConnectionManager.connect('databeacon',
					{
						Type: 'SQLite',
						SQLiteFilePath: TEST_DB_PATH
					},
					function (pError, pConnection)
					{
						if (pError)
						{
							return fDone(pError);
						}

						_Fable.MeadowSQLiteProvider = pConnection.instance;
						_Fable.settings.MeadowProvider = 'SQLite';

						_Fable.serviceManager.addServiceType('RetoldDataBeacon', libRetoldDataBeacon);
						_DataBeacon = _Fable.serviceManager.instantiateServiceProvider('RetoldDataBeacon',
							{
								AutoCreateSchema: true,
								AutoStartOrator: true,

								FullMeadowSchemaPath: libPath.join(__dirname, '..', 'model') + '/',
								FullMeadowSchemaFilename: 'MeadowModel-DataBeacon.json',

								Endpoints:
									{
										MeadowEndpoints: true,
										ConnectionBridge: true,
										SchemaIntrospector: true,
										DynamicEndpointManager: true,
										BeaconProvider: true,
										WebUI: false
									}
							});

						_DataBeacon.initializeService(
							function (pInitError)
							{
								if (pInitError)
								{
									return fDone(pInitError);
								}

								_Server = _Fable.OratorServiceServer.server;
								return fDone();
							});
					});
			}
		);

		suiteTeardown
		(
			function (fDone)
			{
				if (_DataBeacon && _DataBeacon.serviceInitialized)
				{
					_DataBeacon.stopService(
						function ()
						{
							// Clean up test database
							try
							{
								if (libFs.existsSync(TEST_DB_PATH))
								{
									libFs.unlinkSync(TEST_DB_PATH);
								}
							}
							catch (e) { /* ignore cleanup errors */ }
							return fDone();
						});
				}
				else
				{
					return fDone();
				}
			}
		);

		test
		(
			'Service should be initialized',
			function ()
			{
				libAssert.strictEqual(_DataBeacon.serviceInitialized, true);
				libAssert.strictEqual(_DataBeacon.serviceType, 'RetoldDataBeacon');
			}
		);

		test
		(
			'Schema should have been created',
			function ()
			{
				libAssert.ok(_Fable.MeadowSQLiteProvider, 'SQLite provider should exist');
				libAssert.ok(_Fable.MeadowSQLiteProvider.db, 'SQLite db handle should exist');

				// Verify tables exist
				let tmpStmt = _Fable.MeadowSQLiteProvider.db.prepare(
					"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
				let tmpTables = tmpStmt.all();
				let tmpTableNames = tmpTables.map(function (pR) { return pR.name; });

				libAssert.ok(tmpTableNames.indexOf('BeaconConnection') >= 0, 'BeaconConnection table should exist');
				libAssert.ok(tmpTableNames.indexOf('IntrospectedTable') >= 0, 'IntrospectedTable table should exist');
				libAssert.ok(tmpTableNames.indexOf('User') >= 0, 'User table should exist');
			}
		);

		test
		(
			'DAL entities should be initialized',
			function ()
			{
				libAssert.ok(_Fable.DAL, 'DAL should exist on fable');
				libAssert.ok(_Fable.DAL.BeaconConnection, 'BeaconConnection DAL should exist');
				libAssert.ok(_Fable.DAL.IntrospectedTable, 'IntrospectedTable DAL should exist');
				libAssert.ok(_Fable.DAL.User, 'User DAL should exist');
			}
		);

		test
		(
			'GET /beacon/connections should return empty list',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connections')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Connections, 'Response should have Connections array');
						libAssert.strictEqual(pResponse.body.Count, 0, 'Should have 0 connections initially');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection should create a connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection')
					.send({
						Name: 'Test SQLite',
						Type: 'SQLite',
						Config: { SQLiteFilePath: TEST_DB_PATH },
						Description: 'Test connection to internal DB'
					})
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');
						libAssert.ok(pResponse.body.Connection, 'Should have Connection object');
						libAssert.strictEqual(pResponse.body.Connection.Name, 'Test SQLite');
						libAssert.strictEqual(pResponse.body.Connection.Type, 'SQLite');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/connections should return the created connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connections')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.Count, 1, 'Should have 1 connection');
						libAssert.strictEqual(pResponse.body.Connections[0].Name, 'Test SQLite');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/connection/1 should return the connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connection/1')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Connection, 'Should have Connection object');
						libAssert.strictEqual(pResponse.body.Connection.Name, 'Test SQLite');
						return fDone();
					});
			}
		);

		test
		(
			'PUT /beacon/connection/1 should update the connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.put('/beacon/connection/1')
					.send({ Description: 'Updated description' })
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');
						libAssert.strictEqual(pResponse.body.Connection.Description, 'Updated description');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/connect should establish live connection',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection/1/connect')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed: ' + JSON.stringify(pResponse.body));
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/introspect should discover tables',
			function (fDone)
			{
				this.timeout(10000);

				libSuperTest(_Server)
					.post('/beacon/connection/1/introspect')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed: ' + JSON.stringify(pResponse.body));
						libAssert.ok(pResponse.body.TableCount > 0, 'Should discover at least one table');

						// Should find our internal tables
						let tmpTableNames = pResponse.body.Tables.map(function (pT) { return pT.TableName; });
						libAssert.ok(tmpTableNames.indexOf('BeaconConnection') >= 0, 'Should find BeaconConnection table');
						libAssert.ok(tmpTableNames.indexOf('User') >= 0, 'Should find User table');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/connection/1/tables should return cached tables',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connection/1/tables')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Count > 0, 'Should have cached tables');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/connection/1/table/User should return column details',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connection/1/table/User')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.TableName, 'User');
						libAssert.ok(pResponse.body.Columns, 'Should have Columns array');
						libAssert.ok(pResponse.body.Columns.length > 0, 'Should have at least one column');

						// Check that column metadata is populated
						let tmpIDCol = pResponse.body.Columns.find(function (pC) { return pC.Name === 'IDUser'; });
						libAssert.ok(tmpIDCol, 'Should have IDUser column');
						libAssert.ok(tmpIDCol.IsPrimaryKey, 'IDUser should be primary key');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/query should execute read-only queries',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection/1/query')
					.send({ SQL: 'SELECT * FROM User' })
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');
						libAssert.ok(pResponse.body.Rows, 'Should have Rows');
						libAssert.ok(pResponse.body.RowCount > 0, 'Should have at least 1 row (system user)');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/query should reject non-SELECT queries',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection/1/query')
					.send({ SQL: 'DELETE FROM User' })
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.Success, false, 'Should fail');
						libAssert.ok(pResponse.body.Error.indexOf('SELECT') >= 0, 'Error should mention SELECT');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/endpoints should return empty list initially',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/endpoints')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.Count, 0, 'Should have 0 endpoints initially');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/endpoint/1/User/enable should wire dynamic User CRUD routes',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/endpoint/1/User/enable')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed: ' + JSON.stringify(pResponse.body));
						libAssert.ok(pResponse.body.Endpoint, 'Should return endpoint detail');

						// Hit the dynamically-registered route to confirm it's live.
						libSuperTest(_Server)
							.get('/1.0/Users/0/50')
							.expect(200)
							.end(function (pListError, pListResponse)
							{
								if (pListError) return fDone(pListError);
								libAssert.ok(Array.isArray(pListResponse.body), 'User list endpoint should respond with an array');
								return fDone();
							});
					});
			}
		);

		test
		(
			'disconnect + reconnect should restore enabled endpoints automatically',
			function (fDone)
			{
				this.timeout(10000);

				// Tear down the live connection; the /1.0/Users route is still
				// physically registered in Restify (it can't be removed), but
				// the in-memory handle should be cleared.
				libSuperTest(_Server)
					.post('/beacon/connection/1/disconnect')
					.expect(200)
					.end(function (pDisconnectError, pDisconnectResponse)
					{
						if (pDisconnectError) return fDone(pDisconnectError);
						libAssert.ok(pDisconnectResponse.body.Success, 'Disconnect should succeed');

						// listEndpoints() should no longer advertise the User endpoint.
						libSuperTest(_Server)
							.get('/beacon/endpoints')
							.expect(200)
							.end(function (pListError, pListResponse)
							{
								if (pListError) return fDone(pListError);
								libAssert.strictEqual(pListResponse.body.Count, 0, 'Endpoints list should be empty while disconnected');

								// Reconnect and check the response advertises how
								// many endpoints were restored (the bug fix).
								libSuperTest(_Server)
									.post('/beacon/connection/1/connect')
									.expect(200)
									.end(function (pConnectError, pConnectResponse)
									{
										if (pConnectError) return fDone(pConnectError);
										libAssert.ok(pConnectResponse.body.Success, 'Reconnect should succeed');
										libAssert.ok(pConnectResponse.body.EndpointsRestored >= 1,
											'Reconnect should restore at least one endpoint; got: ' + JSON.stringify(pConnectResponse.body));

										// The /1.0/Users/0/50 endpoint should work WITHOUT the
										// user toggling it off and back on — this is the exact
										// regression this test guards.
										libSuperTest(_Server)
											.get('/1.0/Users/0/50')
											.expect(200)
											.end(function (pUsersError, pUsersResponse)
											{
												if (pUsersError) return fDone(pUsersError);
												libAssert.ok(Array.isArray(pUsersResponse.body), 'User endpoint should work after reconnect with no manual toggle');
												return fDone();
											});
									});
							});
					});
			}
		);

		test
		(
			'POST /beacon/endpoint/1/User/disable should tear the endpoint back down',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/endpoint/1/User/disable')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed: ' + JSON.stringify(pResponse.body));

						libSuperTest(_Server)
							.get('/beacon/endpoints')
							.expect(200)
							.end(function (pListError, pListResponse)
							{
								if (pListError) return fDone(pListError);
								libAssert.strictEqual(pListResponse.body.Count, 0, 'Endpoints list should be empty after disable');
								return fDone();
							});
					});
			}
		);

		test
		(
			'GET /beacon/connection/available-types should list installed types',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/connection/available-types')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Types, 'Should have Types array');
						libAssert.ok(pResponse.body.Types.length > 0, 'Should have at least one type');

						let tmpSQLite = pResponse.body.Types.find(function (pT) { return pT.Type === 'SQLite'; });
						libAssert.ok(tmpSQLite, 'SQLite should be in the list');
						return fDone();
					});
			}
		);

		test
		(
			'GET /beacon/ultravisor/status should report disconnected',
			function (fDone)
			{
				libSuperTest(_Server)
					.get('/beacon/ultravisor/status')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.strictEqual(pResponse.body.Connected, false, 'Beacon should not be connected');
						return fDone();
					});
			}
		);

		test
		(
			'POST /beacon/connection/1/disconnect should disconnect',
			function (fDone)
			{
				libSuperTest(_Server)
					.post('/beacon/connection/1/disconnect')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');
						return fDone();
					});
			}
		);

		test
		(
			'DELETE /beacon/connection/1 should soft-delete',
			function (fDone)
			{
				libSuperTest(_Server)
					.delete('/beacon/connection/1')
					.expect(200)
					.end(function (pError, pResponse)
					{
						if (pError) return fDone(pError);
						libAssert.ok(pResponse.body.Success, 'Should succeed');

						// Verify it no longer appears in the list
						libSuperTest(_Server)
							.get('/beacon/connections')
							.expect(200)
							.end(function (pListError, pListResponse)
							{
								if (pListError) return fDone(pListError);
								libAssert.strictEqual(pListResponse.body.Count, 0, 'Should have 0 connections after delete');
								return fDone();
							});
					});
			}
		);

		// ----------------------------------------------------------------
		// _runQuery driver dispatch (unit-style — no live external DBs)
		//
		// These tests prove the query-execution dispatcher reaches every
		// supported driver by feeding it a minimal mock provider with the
		// shape of each driver's pool. They guard against regressions in
		// the symptom the user reported: "MSSQL isn't supported."
		// ----------------------------------------------------------------
		suite
		(
			'_runQuery driver dispatch',
			function ()
			{
				let _Introspector = null;

				suiteSetup
				(
					function ()
					{
						_Introspector = _Fable.DataBeaconSchemaIntrospector;
						libAssert.ok(_Introspector, 'SchemaIntrospector service should be available');
						libAssert.strictEqual(typeof _Introspector._runQuery, 'function', '_runQuery should exist');
					}
				);

				test
				(
					'MySQL: dispatches to pool.query callback',
					function (fDone)
					{
						let tmpRows = [ { id: 1 }, { id: 2 } ];
						let tmpProvider =
						{
							pool:
							{
								query: function (pSQL, fCb) { return fCb(null, tmpRows); }
							}
						};
						_Introspector._runQuery('MySQL', tmpProvider, 'SELECT 1', function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpRows);
							return fDone();
						});
					}
				);

				test
				(
					'PostgreSQL: extracts .rows from result',
					function (fDone)
					{
						let tmpResult = { rows: [ { x: 'a' } ], rowCount: 1 };
						let tmpProvider =
						{
							pool:
							{
								query: function (pSQL, fCb) { return fCb(null, tmpResult); }
							}
						};
						_Introspector._runQuery('PostgreSQL', tmpProvider, 'SELECT 1', function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpResult.rows);
							return fDone();
						});
					}
				);

				test
				(
					'SQLite: uses prepare().all()',
					function (fDone)
					{
						let tmpRows = [ { hello: 'world' } ];
						let tmpProvider =
						{
							db:
							{
								prepare: function (pSQL)
								{
									return { all: function () { return tmpRows; } };
								}
							}
						};
						_Introspector._runQuery('SQLite', tmpProvider, 'SELECT 1', function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpRows);
							return fDone();
						});
					}
				);

				test
				(
					'MSSQL: extracts .recordset from request().query() promise — REGRESSION GUARD',
					function (fDone)
					{
						let tmpRecordset = [ { TABLE_NAME: 'User' } ];
						let tmpProvider =
						{
							pool:
							{
								request: function ()
								{
									return {
										query: function (pSQL)
										{
											return Promise.resolve({ recordset: tmpRecordset, rowsAffected: [1] });
										}
									};
								}
							}
						};
						_Introspector._runQuery('MSSQL', tmpProvider, 'SELECT 1', function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpRecordset);
							return fDone();
						});
					}
				);

				test
				(
					'MSSQL: surfaces a query error from the rejected promise',
					function (fDone)
					{
						let tmpProvider =
						{
							pool:
							{
								request: function ()
								{
									return {
										query: function (pSQL)
										{
											return Promise.reject(new Error('Invalid object name dbo.Missing'));
										}
									};
								}
							}
						};
						_Introspector._runQuery('MSSQL', tmpProvider, 'SELECT 1 FROM dbo.Missing', function (pError, pResult)
						{
							libAssert.ok(pError, 'Should produce an error');
							libAssert.ok(/Missing/.test(pError.message), 'Error message should be passed through');
							return fDone();
						});
					}
				);

				test
				(
					'MSSQL: returns clear error when provider not connected',
					function (fDone)
					{
						_Introspector._runQuery('MSSQL', {}, 'SELECT 1', function (pError)
						{
							libAssert.ok(pError, 'Should produce an error');
							libAssert.ok(/not connected/i.test(pError.message), 'Error should mention not-connected');
							return fDone();
						});
					}
				);

				// ----------------------------------------------------------------
				// Parameterized-query path (used by SQLJoin keyset pagination).
				// ----------------------------------------------------------------

				test
				(
					'PostgreSQL: forwards positional params to pool.query',
					function (fDone)
					{
						let tmpSeenSQL    = null;
						let tmpSeenParams = null;
						let tmpResult = { rows: [ { id: 42 } ] };
						let tmpProvider =
						{
							pool:
							{
								query: function (pSQL, pParams, fCb)
								{
									tmpSeenSQL    = pSQL;
									tmpSeenParams = pParams;
									return fCb(null, tmpResult);
								}
							}
						};
						_Introspector._runQuery('PostgreSQL', tmpProvider, 'SELECT * FROM t WHERE id > $1', [12345], function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpResult.rows);
							libAssert.strictEqual(tmpSeenSQL, 'SELECT * FROM t WHERE id > $1');
							libAssert.deepStrictEqual(tmpSeenParams, [12345]);
							return fDone();
						});
					}
				);

				test
				(
					'MySQL: forwards positional params to pool.query',
					function (fDone)
					{
						let tmpSeenParams = null;
						let tmpRows = [ { id: 7 } ];
						let tmpProvider =
						{
							pool:
							{
								query: function (pSQL, pParams, fCb)
								{
									tmpSeenParams = pParams;
									return fCb(null, tmpRows);
								}
							}
						};
						_Introspector._runQuery('MySQL', tmpProvider, 'SELECT * FROM t WHERE id > ?', [99], function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpRows);
							libAssert.deepStrictEqual(tmpSeenParams, [99]);
							return fDone();
						});
					}
				);

				test
				(
					'SQLite: spreads params into prepare().all(...)',
					function (fDone)
					{
						let tmpSeenAllArgs = null;
						let tmpRows = [ { v: 1 } ];
						let tmpProvider =
						{
							db:
							{
								prepare: function (pSQL)
								{
									return { all: function (...pArgs) { tmpSeenAllArgs = pArgs; return tmpRows; } };
								}
							}
						};
						_Introspector._runQuery('SQLite', tmpProvider, 'SELECT * FROM t WHERE id > ?', [3], function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpRows);
							libAssert.deepStrictEqual(tmpSeenAllArgs, [3]);
							return fDone();
						});
					}
				);

				test
				(
					'MSSQL: binds positional params as @p1, @p2, ...',
					function (fDone)
					{
						let tmpInputs = {};
						let tmpProvider =
						{
							pool:
							{
								request: function ()
								{
									return {
										input: function (pName, pValue) { tmpInputs[pName] = pValue; return this; },
										query: function (pSQL) { return Promise.resolve({ recordset: [], rowsAffected: [0] }); }
									};
								}
							}
						};
						_Introspector._runQuery('MSSQL', tmpProvider, 'SELECT * FROM t WHERE id > @p1', [555], function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(tmpInputs, { p1: 555 });
							return fDone();
						});
					}
				);

				test
				(
					'_runQuery back-compat: 4-arg form (no params) still dispatches',
					function (fDone)
					{
						// Same as the existing MySQL test above but proves the
						// arity-detection branch keeps the legacy callsite working.
						let tmpRows = [ { id: 1 } ];
						let tmpProvider =
						{
							pool: { query: function (pSQL, fCb) { return fCb(null, tmpRows); } }
						};
						_Introspector._runQuery('MySQL', tmpProvider, 'SELECT 1', function (pError, pResult)
						{
							libAssert.ifError(pError);
							libAssert.deepStrictEqual(pResult, tmpRows);
							return fDone();
						});
					}
				);

				test
				(
					'MongoDB find: returns cursor.toArray() rows and applies limit',
					function (fDone)
					{
						let tmpDocs = [ { _id: 1, name: 'Ada' }, { _id: 2, name: 'Grace' } ];
						let tmpSeen = null;
						let tmpLimitSeen = null;
						let tmpProvider =
						{
							pool:
							{
								collection: function (pName)
								{
									libAssert.strictEqual(pName, 'users');
									return {
										find: function (pFilter, pOptions)
										{
											tmpSeen = { pFilter, pOptions };
											return {
												sort: function () { return this; },
												skip: function () { return this; },
												limit: function (pLimit) { tmpLimitSeen = pLimit; return this; },
												toArray: function () { return Promise.resolve(tmpDocs); }
											};
										}
									};
								},
								command: function () { throw new Error('command should not be invoked for find'); }
							}
						};
						_Introspector._runQuery('MongoDB', tmpProvider,
							'{"op":"find","collection":"users","filter":{"active":true},"projection":{"name":1},"limit":50}',
							function (pError, pResult)
							{
								libAssert.ifError(pError);
								libAssert.deepStrictEqual(pResult, tmpDocs);
								libAssert.deepStrictEqual(tmpSeen.pFilter, { active: true });
								libAssert.deepStrictEqual(tmpSeen.pOptions, { projection: { name: 1 } });
								libAssert.strictEqual(tmpLimitSeen, 50);
								return fDone();
							});
					}
				);

				test
				(
					'MongoDB aggregate: passes the pipeline through and returns rows',
					function (fDone)
					{
						let tmpDocs = [ { _id: 'US', n: 4 }, { _id: 'UK', n: 2 } ];
						let tmpPipelineSeen = null;
						let tmpProvider =
						{
							pool:
							{
								collection: function (pName)
								{
									return {
										aggregate: function (pPipeline)
										{
											tmpPipelineSeen = pPipeline;
											return { toArray: function () { return Promise.resolve(tmpDocs); } };
										}
									};
								},
								command: function () {}
							}
						};
						_Introspector._runQuery('MongoDB', tmpProvider,
							'{"op":"aggregate","collection":"users","pipeline":[{"$match":{"active":true}},{"$group":{"_id":"$country","n":{"$sum":1}}}]}',
							function (pError, pResult)
							{
								libAssert.ifError(pError);
								libAssert.deepStrictEqual(pResult, tmpDocs);
								libAssert.ok(Array.isArray(tmpPipelineSeen) && tmpPipelineSeen.length === 2);
								return fDone();
							});
					}
				);

				test
				(
					'MongoDB runCommand: extracts cursor.firstBatch when present',
					function (fDone)
					{
						let tmpBatch = [ { _id: 'US' }, { _id: 'UK' } ];
						let tmpProvider =
						{
							pool:
							{
								collection: function () { throw new Error('collection should not be invoked for runCommand'); },
								command: function (pCmd)
								{
									libAssert.deepStrictEqual(pCmd, { distinct: 'users', key: 'country' });
									return Promise.resolve({ cursor: { firstBatch: tmpBatch, id: 0 }, ok: 1 });
								}
							}
						};
						_Introspector._runQuery('MongoDB', tmpProvider,
							'{"op":"runCommand","command":{"distinct":"users","key":"country"}}',
							function (pError, pResult)
							{
								libAssert.ifError(pError);
								libAssert.deepStrictEqual(pResult, tmpBatch);
								return fDone();
							});
					}
				);

				test
				(
					'MongoDB runCommand: wraps a plain command result as a single row',
					function (fDone)
					{
						let tmpProvider =
						{
							pool:
							{
								collection: function () {},
								command: function () { return Promise.resolve({ ok: 1, version: '7.0.0' }); }
							}
						};
						_Introspector._runQuery('MongoDB', tmpProvider,
							'{"op":"runCommand","command":{"buildInfo":1}}',
							function (pError, pResult)
							{
								libAssert.ifError(pError);
								libAssert.strictEqual(pResult.length, 1);
								libAssert.strictEqual(pResult[0].ok, 1);
								return fDone();
							});
					}
				);

				test
				(
					'MongoDB: rejects invalid JSON with a clear message',
					function (fDone)
					{
						let tmpProvider = { pool: { collection: () => {}, command: () => {} } };
						_Introspector._runQuery('MongoDB', tmpProvider, '{not json', function (pError)
						{
							libAssert.ok(pError);
							libAssert.ok(/not valid JSON/.test(pError.message), 'Message should mention invalid JSON: ' + pError.message);
							return fDone();
						});
					}
				);

				test
				(
					'MongoDB: rejects an unknown op',
					function (fDone)
					{
						let tmpProvider = { pool: { collection: () => {}, command: () => {} } };
						_Introspector._runQuery('MongoDB', tmpProvider, '{"op":"delete","collection":"users"}', function (pError)
						{
							libAssert.ok(pError);
							libAssert.ok(/unknown.*op/i.test(pError.message), 'Message should mention unknown op: ' + pError.message);
							return fDone();
						});
					}
				);

				test
				(
					'Solr JSON descriptor: assembles q/rows/fq and returns response.docs',
					function (fDone)
					{
						let tmpDocs = [ { id: 1 }, { id: 2 } ];
						let tmpProvider =
						{
							pool:
							{
								search: function (pQueryString, fCb)
								{
									libAssert.ok(pQueryString.indexOf('q=title%3Afoo') >= 0, 'should URL-encode q');
									libAssert.ok(pQueryString.indexOf('rows=25') >= 0, 'should include rows');
									libAssert.ok(pQueryString.indexOf('fq=active') >= 0, 'should include fq');
									return fCb(null, { response: { docs: tmpDocs, numFound: 2 } });
								}
							}
						};
						_Introspector._runQuery('Solr', tmpProvider,
							'{"q":"title:foo","rows":25,"fq":["active:true"]}',
							function (pError, pResult)
							{
								libAssert.ifError(pError);
								libAssert.deepStrictEqual(pResult, tmpDocs);
								return fDone();
							});
					}
				);

				test
				(
					'Solr raw query string: passed through unchanged',
					function (fDone)
					{
						let tmpProvider =
						{
							pool:
							{
								search: function (pQueryString, fCb)
								{
									libAssert.strictEqual(pQueryString, 'q=title:foo&rows=10');
									return fCb(null, { response: { docs: [], numFound: 0 } });
								}
							}
						};
						_Introspector._runQuery('Solr', tmpProvider, 'q=title:foo&rows=10',
							function (pError, pResult)
							{
								libAssert.ifError(pError);
								libAssert.deepStrictEqual(pResult, []);
								return fDone();
							});
					}
				);

				test
				(
					'RocksDB get: returns a single {Key, Value} row',
					function (fDone)
					{
						let tmpProvider =
						{
							db:
							{
								get: function (pKey, pOptions, fCb) { return fCb(null, '{"name":"Ada"}'); },
								iterator: function () {}
							}
						};
						_Introspector._runQuery('RocksDB', tmpProvider, '{"op":"get","key":"user/123"}',
							function (pError, pResult)
							{
								libAssert.ifError(pError);
								libAssert.deepStrictEqual(pResult, [ { Key: 'user/123', Value: '{"name":"Ada"}' } ]);
								return fDone();
							});
					}
				);

				test
				(
					'RocksDB get: NotFound becomes an empty result (not an error)',
					function (fDone)
					{
						let tmpProvider =
						{
							db:
							{
								get: function (pKey, pOptions, fCb) { return fCb(new Error('NotFound: missing')); },
								iterator: function () {}
							}
						};
						_Introspector._runQuery('RocksDB', tmpProvider, '{"op":"get","key":"user/missing"}',
							function (pError, pResult)
							{
								libAssert.ifError(pError);
								libAssert.deepStrictEqual(pResult, []);
								return fDone();
							});
					}
				);

				test
				(
					'RocksDB scan: honours limit and returns Key/Value rows',
					function (fDone)
					{
						let tmpPairs = [ [ 'user/1', 'Ada' ], [ 'user/2', 'Grace' ], [ 'user/3', 'Katherine' ] ];
						let tmpIndex = 0;
						let tmpOptionsSeen = null;
						let tmpProvider =
						{
							db:
							{
								get: function () {},
								iterator: function (pOptions)
								{
									tmpOptionsSeen = pOptions;
									return {
										next: function (fCb)
										{
											if (tmpIndex >= tmpPairs.length) return fCb(null, undefined, undefined);
											let tmpPair = tmpPairs[tmpIndex++];
											return fCb(null, tmpPair[0], tmpPair[1]);
										},
										end: function (fCb) { return fCb(null); }
									};
								}
							}
						};
						_Introspector._runQuery('RocksDB', tmpProvider,
							'{"op":"scan","start":"user/","end":"user/~","limit":2}',
							function (pError, pResult)
							{
								libAssert.ifError(pError);
								libAssert.strictEqual(pResult.length, 2);
								libAssert.strictEqual(pResult[0].Key, 'user/1');
								libAssert.strictEqual(pResult[1].Key, 'user/2');
								libAssert.strictEqual(tmpOptionsSeen.gte, 'user/');
								libAssert.strictEqual(tmpOptionsSeen.lte, 'user/~');
								libAssert.strictEqual(tmpOptionsSeen.limit, 2);
								return fDone();
							});
					}
				);

				test
				(
					'Non-SQL drivers: clear error when the provider is not connected',
					function (fDone)
					{
						let tmpCases = [ 'MongoDB', 'Solr', 'RocksDB' ];
						let tmpRemaining = tmpCases.length;
						tmpCases.forEach(function (pType)
						{
							_Introspector._runQuery(pType, {}, '{}', function (pError)
							{
								libAssert.ok(pError, `${pType} should error when not connected`);
								libAssert.ok(/not connected/i.test(pError.message),
									`${pType} should say "not connected"; got: ${pError.message}`);
								if (--tmpRemaining === 0) return fDone();
							});
						});
					}
				);

				test
				(
					'Unknown driver: bare not-supported error',
					function (fDone)
					{
						_Introspector._runQuery('Cassandra', {}, 'SELECT 1', function (pError)
						{
							libAssert.ok(pError, 'Should error for unknown driver');
							libAssert.ok(/Cassandra/.test(pError.message), 'Error should include the type name');
							return fDone();
						});
					}
				);
			}
		);
	}
);
