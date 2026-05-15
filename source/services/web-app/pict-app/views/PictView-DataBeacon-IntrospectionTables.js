/**
 * DataBeacon IntrospectionTables View
 *
 * Renders the schema tables list for the currently selected connection.
 * Each row shows column count, row estimate, endpoint status, and an
 * Enable/Disable action. Clicking a table name opens a pict-section-modal
 * with full column details.
 *
 * The provider pre-computes `AppData.Introspection.TablesView` (with
 * per-row display flags) and `AppData.Introspection.TablesHeader`
 * (heading + subline) so this view stays declarative.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'IntrospectionTables',
	DefaultRenderable: 'DataBeacon-IntrospectionTables',
	DefaultDestinationAddress: '#DataBeacon-IntrospectionTables-Slot',
	AutoRender: false,

	Templates:
	[
		{
			Hash: 'DataBeacon-IntrospectionTables-Template',
			Template: /*html*/`
<div id="DataBeacon-IntrospectionTables-Root">
	{~TemplateIfAbsolute:DataBeacon-IntrospectionTables-NoConnections:AppData.Introspection:AppData.Introspection.State^==^NoConnections~}
	{~TemplateIfAbsolute:DataBeacon-IntrospectionTables-NoSelection:AppData.Introspection:AppData.Introspection.State^==^NoSelection~}
	{~TemplateIfAbsolute:DataBeacon-IntrospectionTables-Empty:AppData.Introspection:AppData.Introspection.State^==^Empty~}
	{~TemplateIfAbsolute:DataBeacon-IntrospectionTables-Table:AppData.Introspection:AppData.Introspection.State^==^HasTables~}
</div>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-NoConnections',
			Template: /*html*/`
<p class="empty-state">
	No databases connected. Go to
	<a href="#/view/connections">Connections</a>
	to add and connect a database first.
</p>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-NoSelection',
			Template: `<p class="empty-state">Select a connected database above and click Introspect.</p>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-Empty',
			Template: `<p class="empty-state">No tables discovered yet. Click <strong>Introspect</strong> to scan the database.</p>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-Table',
			Template: /*html*/`
<div class="section">
	<h2>Tables from <strong>{~D:AppData.Introspection.TablesHeader.ConnectionName~}</strong></h2>
	<span class="section-subline">{~D:AppData.Introspection.TablesHeader.Subline~}</span>
	<table class="data-table" style="margin-top:12px;">
		<thead><tr><th>Table</th><th>Columns</th><th>Est. Rows</th><th>Endpoint</th><th>Actions</th></tr></thead>
		<tbody>{~TS:DataBeacon-IntrospectionTables-Row:AppData.Introspection.TablesView~}</tbody>
	</table>
</div>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-Row',
			Template: /*html*/`
<tr>
	<td><a href="#/introspection/table/{~D:Record.ConnectionID~}/{~D:Record.TableName~}">{~D:Record.TableName~}</a></td>
	<td>{~D:Record.ColumnCount~}</td>
	<td>{~D:Record.RowCountDisplay~}</td>
	<td>{~TIf:DataBeacon-IntrospectionTables-Row-EndpointBadge::Record.EndpointsEnabled^TRUE^x~}</td>
	<td class="actions-cell">
		{~TIf:DataBeacon-IntrospectionTables-Row-Disable::Record.EndpointsEnabled^TRUE^x~}
		{~TIf:DataBeacon-IntrospectionTables-Row-Enable::Record.EndpointsEnabled^FALSE^x~}
	</td>
</tr>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-Row-EndpointBadge',
			Template: `<span class="badge badge-success">Active</span>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-Row-Enable',
			Template: /*html*/`
<a class="btn btn-small btn-primary" href="#/endpoints/{~D:Record.ConnectionID~}/{~D:Record.TableName~}/enable">
	<span data-databeacon-icon="check" data-icon-size="14"></span> Enable
</a>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-Row-Disable',
			Template: /*html*/`
<a class="btn btn-small btn-warning" href="#/endpoints/{~D:Record.ConnectionID~}/{~D:Record.TableName~}/disable">
	<span data-databeacon-icon="x" data-icon-size="14"></span> Disable
</a>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-DetailModal',
			Template: /*html*/`
<table class="data-table">
	<thead><tr><th>Column</th><th>Native Type</th><th>Meadow Type</th><th>Nullable</th><th>Default</th></tr></thead>
	<tbody>{~TS:DataBeacon-IntrospectionTables-DetailModal-Row:AppData.Introspection.DetailModalColumns~}</tbody>
</table>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-DetailModal-Row',
			Template: /*html*/`
<tr>
	<td>
		<strong>{~D:Record.Name~}</strong>
		{~TIf:DataBeacon-IntrospectionTables-DetailModal-Row-PK::Record.IsPrimaryKey^TRUE^x~}
		{~TIf:DataBeacon-IntrospectionTables-DetailModal-Row-Auto::Record.IsAutoIncrement^TRUE^x~}
	</td>
	<td>{~D:Record.NativeTypeDisplay~}</td>
	<td>{~D:Record.MeadowType~}</td>
	<td>{~D:Record.NullableDisplay~}</td>
	<td>{~D:Record.DefaultValueDisplay~}</td>
</tr>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-DetailModal-Row-PK',
			Template: `<span class="badge badge-info">PK</span>`
		},
		{
			Hash: 'DataBeacon-IntrospectionTables-DetailModal-Row-Auto',
			Template: `<span class="badge badge-neutral">AUTO</span>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-IntrospectionTables',
			TemplateHash: 'DataBeacon-IntrospectionTables-Template',
			ContentDestinationAddress: '#DataBeacon-IntrospectionTables-Slot',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconIntrospectionTables extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-IntrospectionTables-Root');

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	// Router-handler entry point (Application.viewTable).  Opens a modal
	// with the table's column details.  Kept imperative to host the modal
	// orchestration; the actual "which table?" dispatch is driven by the
	// #/introspection/table/:connId/:table route.
	_viewTableDetails(pConnectionID, pTableName)
	{
		this._showDetail(parseInt(pConnectionID, 10), pTableName);
	}

	_showDetail(pConnectionID, pTableName)
	{
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		if (!tmpModal) return;

		tmpProvider.loadTableDetails(pConnectionID, pTableName, (pError, pData) =>
		{
			if (pError || !pData || !pData.Columns)
			{
				tmpModal.toast('Failed to load table details.', { type: 'error' });
				return;
			}

			// Pre-compute display-ready column records and stash them in AppData
			// so parseTemplateByHash can resolve {~D:AppData.Introspection.DetailModalColumns~}.
			if (!this.pict.AppData.Introspection) this.pict.AppData.Introspection = {};
			this.pict.AppData.Introspection.DetailModalColumns = this._buildDetailRows(pData.Columns);

			let tmpContent = this.pict.parseTemplateByHash('DataBeacon-IntrospectionTables-DetailModal', null);

			let tmpConn = this._getSelectedConnection();
			let tmpTitle = tmpConn ? `${pTableName} — ${tmpConn.Name}` : pTableName;
			tmpModal.show({
				title: tmpTitle,
				content: tmpContent,
				closeable: true,
				width: '720px',
				buttons: [ { Hash: 'close', Label: 'Close', Style: 'primary' } ]
			});
		});
	}

	_buildDetailRows(pColumns)
	{
		let tmpRows = [];
		for (let i = 0; i < pColumns.length; i++)
		{
			let tmpCol = pColumns[i];
			tmpRows.push(
			{
				Name: tmpCol.Name,
				IsPrimaryKey: !!tmpCol.IsPrimaryKey,
				IsAutoIncrement: !!tmpCol.IsAutoIncrement,
				NativeTypeDisplay: tmpCol.NativeType + (tmpCol.MaxLength ? `(${tmpCol.MaxLength})` : ''),
				MeadowType: tmpCol.MeadowType || '',
				NullableDisplay: tmpCol.Nullable ? 'YES' : 'NO',
				DefaultValueDisplay: (tmpCol.DefaultValue === null || tmpCol.DefaultValue === undefined) ? '--' : String(tmpCol.DefaultValue)
			});
		}
		return tmpRows;
	}

	_getSelectedConnection()
	{
		let tmpCID = this.pict.AppData.SelectedConnectionID;
		if (!tmpCID) return null;
		let tmpConns = this.pict.AppData.Connections || [];
		for (let i = 0; i < tmpConns.length; i++)
		{
			if (tmpConns[i].IDBeaconConnection === tmpCID) return tmpConns[i];
		}
		return null;
	}
}

module.exports = PictViewDataBeaconIntrospectionTables;
module.exports.default_configuration = _ViewConfiguration;
