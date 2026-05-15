/**
 * DataBeacon RecordBrowser View
 *
 * Table picker + paginated record table. Users pick a page size, a
 * cursor-start offset, and page forward/backward through the underlying
 * endpoint. The provider populates AppData.RecordBrowser with render-ready
 * fields (ColumnList, Rows, CursorStart, PageSize, PrevDisabled,
 * NextDisabled, RangeLabel, PageSizeOptions) so templates stay declarative.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'RecordBrowser',
	DefaultRenderable: 'DataBeacon-RecordBrowser',
	DefaultDestinationAddress: '#DataBeacon-RecordBrowser-Slot',
	AutoRender: false,

	CSS: /*css*/`
		.databeacon-records-toolbar
		{
			display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end;
		}
		.databeacon-records-toolbar .form-group
		{
			display: flex; flex-direction: column; gap: 4px; margin: 0;
		}
		.databeacon-records-toolbar .form-group label
		{
			font-size: 12px; line-height: 1; color: var(--theme-color-text-muted, #7a7a7a);
			text-transform: uppercase; letter-spacing: 0.4px;
			margin: 0;
		}
		/* Single uniform control height: inputs, selects, and anchor-styled
		   buttons inside the toolbar all share this so labels stay aligned. */
		.databeacon-records-toolbar input,
		.databeacon-records-toolbar select,
		.databeacon-records-toolbar .btn
		{
			height: 32px;
			box-sizing: border-box;
			line-height: 1.2;
			padding: 0 10px;
			font-size: 13px;
		}
		/* Anchors styled as buttons don't vertically center their text the
		   way block inputs do; inline-flex centers the label (and any icon
		   span) cleanly on the 32px row. */
		.databeacon-records-toolbar .btn
		{
			display: inline-flex;
			align-items: center;
			justify-content: center;
			gap: 4px;
		}
		.databeacon-records-pager-buttons { display: flex; gap: 6px; align-items: stretch; }
		.databeacon-records-start-input { width: 100px; }
		.databeacon-records-pagesize-select { width: 90px; }
		/* Flex grow lives on the form-group (a toolbar row child) so the
		   group widens on the main axis; the input below just fills the
		   group's width.  Putting flex-basis on the input itself would set
		   its height inside the column-flex form-group. */
		.databeacon-records-filter-group { flex: 1 1 260px; min-width: 260px; max-width: 520px; }
		.databeacon-records-filter-input { width: 100%; }
		.databeacon-records-range { margin-top: 8px; color: var(--theme-color-text-muted, #7a7a7a); font-size: 12px; }
		.databeacon-records-count-badge
		{
			display: inline-block; padding: 1px 8px; margin-left: 6px;
			border-radius: 10px; background: var(--theme-color-background-input, var(--theme-color-background-panel, #ffffff)); color: var(--theme-color-text-primary, #1a1a1a);
			font-size: 11px; font-weight: 600;
		}
		.databeacon-records-pagination
		{
			display: flex; flex-wrap: wrap; gap: 4px; align-items: center;
			margin-top: 14px;
		}
		.databeacon-records-pagination .btn { min-width: 34px; padding: 0 8px; height: 30px; }
		.databeacon-records-pagination .btn.current
		{
			background: var(--theme-color-brand-primary, #000080); color: var(--theme-color-background-panel, #fffbf0);
			border-color: var(--theme-color-brand-primary, #000080);
		}
		.databeacon-records-pagination-ellipsis
		{
			padding: 0 6px; color: var(--theme-color-text-muted, #7a7a7a); font-size: 13px;
		}
		.databeacon-export-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 10px; }
		.databeacon-export-bar .databeacon-export-label { color: var(--theme-color-text-muted, #7a7a7a); font-size: 12px; margin-right: 4px; }
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-RecordBrowser-Template',
			Template: /*html*/`
<div id="DataBeacon-RecordBrowser-Root" class="section">
	<div class="databeacon-records-toolbar">
		<div class="form-group">
			<label>Table</label>
			<select id="databeacon-records-table" onchange="{~P~}.PictApplication.selectRecordsTable(this.value)">
				<option value="">-- Select Table --</option>
				{~TS:DataBeacon-RecordBrowser-TableOption:AppData.RecordBrowser.TableOptions~}
			</select>
		</div>
		<div class="form-group">
			<label>Page Size</label>
			<select class="databeacon-records-pagesize-select" onchange="{~P~}.PictApplication.changeRecordsPageSize(this.value)">
				{~TS:DataBeacon-RecordBrowser-PageSizeOption:AppData.RecordBrowser.PageSizeOptions~}
			</select>
		</div>
		<div class="form-group">
			<label>Page</label>
			<input type="number" class="databeacon-records-start-input" min="1" step="1" value="{~D:AppData.RecordBrowser.Page:1~}" onchange="{~P~}.PictApplication.goToRecordsPage(this.value)" />
		</div>
		<div class="form-group databeacon-records-filter-group">
			<label>Filter (meadow FBL)</label>
			<input type="text" id="databeacon-records-filter" class="databeacon-records-filter-input" placeholder="FBV~Column~EQ~Value~FBV~Other~LK~%25foo%25" value="{~D:AppData.RecordBrowser.FilterString:~}" onchange="{~P~}.PictApplication.applyRecordsFilter(this.value)" />
		</div>
		<div class="form-group">
			<label>&nbsp;</label>
			<div class="databeacon-records-pager-buttons">
				<a class="btn btn-small btn-secondary" href="#/records/filter/apply" title="Apply the filter currently in the input">Apply</a>
				<a class="btn btn-small btn-secondary {~D:AppData.RecordBrowser.FilterClearClass~}" href="#/records/filter/clear" title="Remove the filter">Clear</a>
			</div>
		</div>
		<div class="form-group">
			<label>&nbsp;</label>
			<a class="btn btn-small btn-primary {~D:AppData.RecordBrowser.LoadDisabledClass~}" href="#/records/load">
				<span data-databeacon-icon="refresh" data-icon-size="14"></span> Reload
			</a>
		</div>
	</div>
	<div class="databeacon-records-range">
		{~D:AppData.RecordBrowser.RangeLabel~}
		{~TemplateIfAbsolute:DataBeacon-RecordBrowser-CountBadge:AppData.RecordBrowser:AppData.RecordBrowser.HasTotalCount^TRUE^x~}
	</div>
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-Empty:AppData.RecordBrowser:AppData.RecordBrowser.State^==^Empty~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-NoSelection:AppData.RecordBrowser:AppData.RecordBrowser.State^==^NoSelection~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-Table:AppData.RecordBrowser:AppData.RecordBrowser.State^==^HasRows~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-Pagination:AppData.RecordBrowser:AppData.RecordBrowser.ShowPagination^TRUE^x~}
	{~TemplateIfAbsolute:DataBeacon-RecordBrowser-ExportBar:AppData.RecordBrowser:AppData.RecordBrowser.State^==^HasRows~}
</div>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-ExportBar',
			Template: /*html*/`
<div class="databeacon-export-bar">
	<span class="databeacon-export-label">Export current page:</span>
	<a class="btn btn-small btn-secondary" href="#/records/export/json">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON
	</a>
	<a class="btn btn-small btn-secondary" href="#/records/export/json-comp">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON Comprehension
	</a>
	<a class="btn btn-small btn-secondary" href="#/records/export/csv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> CSV
	</a>
	<a class="btn btn-small btn-secondary" href="#/records/export/tsv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> TSV
	</a>
</div>
<div class="databeacon-export-bar">
	<span class="databeacon-export-label">Export <strong>all {~D:AppData.RecordBrowser.FullExportLabel~}</strong>:</span>
	<a class="btn btn-small btn-secondary" href="#/records/export-all/json-comp">
		<span data-databeacon-icon="download" data-icon-size="14"></span> Comprehension
	</a>
	<a class="btn btn-small btn-secondary" href="#/records/export-all/csv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> CSV
	</a>
</div>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-CountBadge',
			Template: `<span class="databeacon-records-count-badge">{~D:AppData.RecordBrowser.TotalCountLabel~}</span>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-Pagination',
			Template: /*html*/`
<div class="databeacon-records-pagination">
	<a class="btn btn-small btn-secondary {~D:AppData.RecordBrowser.PrevDisabledClass~}" href="{~D:AppData.RecordBrowser.PrevHref~}" title="Previous page">
		<span data-databeacon-icon="chevron-left" data-icon-size="14"></span>
	</a>
	{~TS:DataBeacon-RecordBrowser-PaginationLink:AppData.RecordBrowser.PageLinks~}
	<a class="btn btn-small btn-secondary {~D:AppData.RecordBrowser.NextDisabledClass~}" href="{~D:AppData.RecordBrowser.NextHref~}" title="Next page">
		<span data-databeacon-icon="chevron-right" data-icon-size="14"></span>
	</a>
</div>`
		},
		{
			// Each pagination entry is either a link (Kind=link) or an ellipsis
			// spacer (Kind=ellipsis).  Rendered via TIf on Kind so one template
			// covers both cases without a branch in the provider.
			Hash: 'DataBeacon-RecordBrowser-PaginationLink',
			Template: /*html*/`{~TIf:DataBeacon-RecordBrowser-PaginationLinkItem::Record.Kind^link^x~}{~TIf:DataBeacon-RecordBrowser-PaginationEllipsis::Record.Kind^ellipsis^x~}`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-PaginationLinkItem',
			Template: `<a class="btn btn-small btn-secondary {~D:Record.CurrentClass~}" href="{~D:Record.Href~}">{~D:Record.Label~}</a>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-PaginationEllipsis',
			Template: `<span class="databeacon-records-pagination-ellipsis">…</span>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-TableOption',
			Template: `<option value="{~D:Record.TableName~}" {~D:Record.SelectedAttr~}>{~D:Record.TableName~}</option>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-PageSizeOption',
			Template: `<option value="{~D:Record.Value~}" {~D:Record.SelectedAttr~}>{~D:Record.Value~}</option>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-NoSelection',
			Template: `<p class="empty-state">Select an enabled table and click Reload.</p>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-Empty',
			Template: `<p class="empty-state">No records in this page.</p>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-Table',
			Template: /*html*/`
<div class="section">
	<h2>{~D:AppData.RecordBrowser.TableName~}</h2>
	<div class="table-scroll">
		<table class="data-table">
			<thead><tr>{~TS:DataBeacon-RecordBrowser-HeaderCell:AppData.RecordBrowser.ColumnList~}</tr></thead>
			<tbody>{~TS:DataBeacon-RecordBrowser-Row:AppData.RecordBrowser.Rows~}</tbody>
		</table>
	</div>
</div>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-HeaderCell',
			Template: `<th>{~D:Record.Name~}</th>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-Row',
			Template: `<tr>{~TS:DataBeacon-RecordBrowser-Cell:Record.Cells~}</tr>`
		},
		{
			Hash: 'DataBeacon-RecordBrowser-Cell',
			Template: `<td>{~D:Record.CellHTML~}</td>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-RecordBrowser',
			TemplateHash: 'DataBeacon-RecordBrowser-Template',
			ContentDestinationAddress: '#DataBeacon-RecordBrowser-Slot',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconRecordBrowser extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-RecordBrowser-Root');

		this.pict.CSSMap.injectCSS();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	// ── Router-handler entry points (called by Application) ────────────────
	// Each method is called from a `#/records/...` route or an inline
	// onchange expression (select/input).  No addEventListener delegation.

	_loadCurrent()
	{
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		if (!tmpTable) { return; }
		let tmpStart = this._clampStart(tmpBrowser.CursorStart);
		let tmpSize = this._clampSize(tmpBrowser.PageSize);
		tmpProvider.loadRecords(tmpTable, tmpStart, tmpSize, tmpBrowser.FilterString || '');
	}

	_pagePrev()  { this._pageStep(-1); }
	_pageNext()  { this._pageStep(+1); }

	_pageStep(pDir)
	{
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		if (!tmpTable) { return; }
		let tmpSize = this._clampSize(tmpBrowser.PageSize);
		let tmpCurrent = this._clampStart(tmpBrowser.CursorStart);
		let tmpTotal = (typeof tmpBrowser.TotalCount === 'number' && tmpBrowser.TotalCount > 0) ? tmpBrowser.TotalCount : Infinity;
		let tmpMaxStart = (tmpTotal === Infinity) ? Infinity : Math.max(0, tmpTotal - 1);
		let tmpNext = Math.min(tmpMaxStart, Math.max(0, tmpCurrent + pDir * tmpSize));
		this.pict.AppData.RecordBrowser.CursorStart = tmpNext;
		this.pict.AppData.RecordBrowser.Page = this._pageFromStart(tmpNext, tmpSize);
		this.pict.providers.DataBeaconProvider.loadRecords(tmpTable, tmpNext, tmpSize, tmpBrowser.FilterString || '');
	}

	_goToPage(pPage)
	{
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		if (!tmpTable) { return; }
		let tmpSize = this._clampSize(tmpBrowser.PageSize);
		let tmpPage = parseInt(pPage, 10);
		if (isNaN(tmpPage) || tmpPage < 1) { tmpPage = 1; }
		let tmpStart = (tmpPage - 1) * tmpSize;
		this.pict.AppData.RecordBrowser.CursorStart = tmpStart;
		this.pict.AppData.RecordBrowser.Page = tmpPage;
		this.pict.providers.DataBeaconProvider.loadRecords(tmpTable, tmpStart, tmpSize, tmpBrowser.FilterString || '');
	}

	_applyFilter(pFilterString)
	{
		if (!this.pict.AppData.RecordBrowser) { this.pict.AppData.RecordBrowser = {}; }
		this.pict.AppData.RecordBrowser.FilterString = (pFilterString || '').trim();
		this.pict.AppData.RecordBrowser.CursorStart = 0;
		this.pict.AppData.RecordBrowser.Page = 1;
		// Kick a non-blocking count refresh then load the first page.
		this._refreshTotalCount();
		this._loadCurrent();
	}

	_clearFilter()  { this._applyFilter(''); }

	_refreshTotalCount()
	{
		let tmpTable = this.pict.AppData.SelectedTableName;
		if (!tmpTable) { return; }
		let tmpFilter = (this.pict.AppData.RecordBrowser && this.pict.AppData.RecordBrowser.FilterString) || '';
		let tmpProv = this.pict.providers.DataBeaconProvider;
		if (tmpProv && typeof tmpProv.loadRecordCount === 'function')
		{
			tmpProv.loadRecordCount(tmpTable, tmpFilter);
		}
	}

	_exportRecords(pFormat)
	{
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		let tmpStart = this._clampStart(tmpBrowser.CursorStart);
		let tmpSize = this._clampSize(tmpBrowser.PageSize);
		this._export(pFormat, tmpTable, tmpStart, tmpSize);
	}

	_exportAllRecords(pFormat)
	{
		let tmpProv = this.pict.providers.DataBeaconProvider;
		let tmpExport = this.pict.providers['DataBeacon-Export'];
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		let tmpBrowser = this.pict.AppData.RecordBrowser || {};
		let tmpTable = this.pict.AppData.SelectedTableName;
		let tmpFilter = tmpBrowser.FilterString || '';
		if (!tmpTable || !tmpExport || !tmpProv || typeof tmpProv.loadRecordsAll !== 'function') { return; }

		if (tmpModal) { tmpModal.toast('Fetching full record set for export…', { type: 'info' }); }
		tmpProv.loadRecordsAll(tmpTable, tmpFilter,
			(pErr, pRows) =>
			{
				if (pErr || !Array.isArray(pRows))
				{
					if (tmpModal) { tmpModal.toast(`Export fetch failed: ${pErr ? pErr.message : 'unknown'}`, { type: 'error' }); }
					return;
				}
				if (pRows.length === 0)
				{
					if (tmpModal) { tmpModal.toast('No records to export.', { type: 'warning' }); }
					return;
				}
				let tmpFilterSlug = this._filenameSlug(tmpFilter);
				let tmpBaseName = tmpFilterSlug
					? `${tmpTable}-all-filtered-${tmpFilterSlug}`
					: `${tmpTable}-all`;
				let tmpKeyField = this._findGUIDField(tmpTable, pRows);
				tmpExport.exportRows(pFormat, pRows,
					{
						BaseName: tmpBaseName,
						EntityName: tmpTable || 'Record',
						KeyField: tmpKeyField
					});
			});
	}

	_filenameSlug(pFilterString)
	{
		if (!pFilterString) { return ''; }
		return String(pFilterString)
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 60);
	}

	_pageFromStart(pStart, pSize)
	{
		let tmpStart = parseInt(pStart, 10) || 0;
		let tmpSize = parseInt(pSize, 10) || 1;
		return Math.floor(tmpStart / tmpSize) + 1;
	}

	_selectTable(pTableName)
	{
		this.pict.AppData.SelectedTableName = pTableName || '';
		if (!this.pict.AppData.RecordBrowser) { this.pict.AppData.RecordBrowser = {}; }
		this.pict.AppData.RecordBrowser.CursorStart = 0;
		this.pict.AppData.RecordBrowser.Page = 1;
		// Changing table invalidates any prior filter/count.
		this.pict.AppData.RecordBrowser.FilterString = '';
		this.pict.AppData.RecordBrowser.TotalCount = null;
		let tmpProv = this.pict.providers.DataBeaconProvider;
		if (pTableName && tmpProv)
		{
			this._refreshTotalCount();
			tmpProv.loadRecords(pTableName, 0, this._clampSize(this.pict.AppData.RecordBrowser.PageSize), '');
		}
		else if (tmpProv && typeof tmpProv.refreshRecordBrowserViewData === 'function')
		{
			tmpProv.refreshRecordBrowserViewData();
			this.render();
		}
	}

	_setPageSize(pRawValue)
	{
		let tmpSize = this._clampSize(pRawValue);
		if (!this.pict.AppData.RecordBrowser) { this.pict.AppData.RecordBrowser = {}; }
		this.pict.AppData.RecordBrowser.PageSize = tmpSize;
		// Recompute page 1 for consistency (current CursorStart may not align).
		this.pict.AppData.RecordBrowser.CursorStart = 0;
		this.pict.AppData.RecordBrowser.Page = 1;
		this._loadCurrent();
	}

	_export(pFormat, pTable, pStart, pSize)
	{
		let tmpExport = this.pict.providers['DataBeacon-Export'];
		if (!tmpExport) return;
		let tmpRows = Array.isArray(this.pict.AppData.Records) ? this.pict.AppData.Records : [];
		if (tmpRows.length === 0) return;

		let tmpEntity = pTable || 'Record';
		let tmpKeyField = this._findGUIDField(tmpEntity, tmpRows);
		let tmpBase = `${tmpEntity}-${pStart}-${pStart + tmpRows.length - 1}`;
		tmpExport.exportRows(pFormat, tmpRows,
		{
			BaseName: tmpBase,
			EntityName: tmpEntity,
			KeyField: tmpKeyField
		});
	}

	/**
	 * Resolve the Comprehension key column for the selected table.
	 *
	 * Meadow's Comprehension format keys records by a GUID column, not the
	 * numeric primary key. The default GUIDName is `GUID${Entity}` (e.g.
	 * `GUIDUser` for the `User` entity). We try, in order:
	 *   1) Exact match `GUID${Entity}` on the first row.
	 *   2) Exact match `GUID${Entity}` in the introspected column list.
	 *   3) Any column whose name starts with `GUID[A-Z]` in the first row.
	 *   4) null — the exporter then falls back to 1-based row index.
	 */
	_findGUIDField(pEntityName, pRows)
	{
		let tmpFirstRow = (pRows && pRows.length > 0 && typeof pRows[0] === 'object' && pRows[0] !== null) ? pRows[0] : null;

		if (pEntityName && tmpFirstRow)
		{
			let tmpExpected = `GUID${pEntityName}`;
			if (Object.prototype.hasOwnProperty.call(tmpFirstRow, tmpExpected))
			{
				return tmpExpected;
			}
		}

		if (pEntityName)
		{
			let tmpTables = this.pict.AppData.Tables || [];
			let tmpExpected = `GUID${pEntityName}`;
			for (let i = 0; i < tmpTables.length; i++)
			{
				if (tmpTables[i].TableName !== pEntityName) continue;
				let tmpColumns = tmpTables[i].Columns || [];
				for (let c = 0; c < tmpColumns.length; c++)
				{
					if (tmpColumns[c].Name === tmpExpected) return tmpExpected;
				}
				break;
			}
		}

		if (tmpFirstRow)
		{
			let tmpKeys = Object.keys(tmpFirstRow);
			for (let k = 0; k < tmpKeys.length; k++)
			{
				if (/^GUID[A-Z]/.test(tmpKeys[k])) return tmpKeys[k];
			}
		}
		return null;
	}

	_clampStart(pValue)
	{
		let tmpN = parseInt(pValue, 10);
		if (isNaN(tmpN) || tmpN < 0) return 0;
		return tmpN;
	}

	_clampSize(pValue)
	{
		let tmpN = parseInt(pValue, 10);
		if (isNaN(tmpN) || tmpN < 1) return 50;
		if (tmpN > 1000) return 1000;
		return tmpN;
	}
}

module.exports = PictViewDataBeaconRecordBrowser;
module.exports.default_configuration = _ViewConfiguration;
