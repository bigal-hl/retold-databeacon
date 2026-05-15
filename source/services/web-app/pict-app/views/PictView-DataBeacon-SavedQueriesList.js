/**
 * DataBeacon SavedQueriesList View
 *
 * Collapsible panel above the QueryPanel that lists saved SQL queries.
 * Handles Load / Edit / Delete actions and opens the shared save/edit
 * form modal (also used by QueryPanel's Save button). Persists via the
 * DataBeacon-SavedQueries provider.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'SavedQueriesList',
	DefaultRenderable: 'DataBeacon-SavedQueriesList',
	DefaultDestinationAddress: '#DataBeacon-SavedQueries-Slot',
	AutoRender: false,

	CSS: /*css*/`
		.databeacon-saved-panel { padding: 0; }
		.databeacon-saved-header
		{
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 12px;
			padding: 14px 20px;
			cursor: pointer;
			user-select: none;
		}
		.databeacon-saved-header h2 { margin: 0; font-size: 16px; font-weight: 600; }
		.databeacon-saved-header-right { display: flex; align-items: center; gap: 10px; color: var(--theme-color-text-muted, #7a7a7a); font-size: 13px; }
		.databeacon-saved-body { padding: 0 20px 20px 20px; border-top: 1px solid var(--theme-color-border-default, #808080); }
		.databeacon-saved-empty { color: var(--theme-color-text-muted, #7a7a7a); padding: 16px 0; font-style: italic; }
		.databeacon-saved-row { }
		.databeacon-saved-row.is-active-query { background: color-mix(in srgb, var(--theme-color-brand-primary, #000080) 15%, transparent); }
		.databeacon-saved-name { font-weight: 600; }
		.databeacon-saved-docpreview { color: var(--theme-color-text-muted, #7a7a7a); font-size: 12px; margin-top: 2px; }
		.databeacon-saved-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
		.databeacon-saved-form-grid .full { grid-column: 1 / span 2; }
		.databeacon-saved-form-grid label { display: block; font-size: 12px; color: var(--theme-color-text-secondary, #4a4a4a); margin-bottom: 4px; }
		.databeacon-saved-form-grid input,
		.databeacon-saved-form-grid textarea,
		.databeacon-saved-form-grid select { width: 100%; }
		.databeacon-saved-form-grid textarea { min-height: 80px; resize: vertical; }
		.databeacon-saved-form-sqlpreview
		{
			background: var(--theme-color-background-input, var(--theme-color-background-panel, #ffffff));
			color: var(--theme-color-text-primary, #1a1a1a);
			border: 1px solid var(--theme-color-border-default, #808080);
			border-radius: 4px;
			padding: 8px;
			font-family: 'SFMono-Regular', Menlo, Consolas, monospace;
			font-size: 12px;
			max-height: 160px;
			overflow: auto;
			white-space: pre-wrap;
		}
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-SavedQueriesList-Template',
			Template: /*html*/`
<div id="DataBeacon-SavedQueries-Root" class="section databeacon-saved-panel">
	<a class="databeacon-saved-header" href="#/saved-queries/toggle">
		<h2>Saved Queries ({~D:AppData.SavedQueries.Count:0~})</h2>
		<div class="databeacon-saved-header-right">
			<span>{~D:AppData.SavedQueries.ToggleLabel~}</span>
			<span data-databeacon-icon="{~D:AppData.SavedQueries.ToggleIcon~}" data-icon-size="16"></span>
		</div>
	</a>
	{~TemplateIfAbsolute:DataBeacon-SavedQueriesList-Body:AppData.SavedQueries:AppData.SavedQueries.Expanded^TRUE^x~}
</div>`
		},
		{
			Hash: 'DataBeacon-SavedQueriesList-Body',
			Template: /*html*/`
<div class="databeacon-saved-body">
	{~TemplateIfAbsolute:DataBeacon-SavedQueriesList-Empty:AppData.SavedQueries:AppData.SavedQueries.IsEmpty^TRUE^x~}
	{~TemplateIfAbsolute:DataBeacon-SavedQueriesList-Table:AppData.SavedQueries:AppData.SavedQueries.IsEmpty^FALSE^x~}
</div>`
		},
		{
			Hash: 'DataBeacon-SavedQueriesList-Empty',
			Template: `<p class="databeacon-saved-empty">No saved queries yet. Write a query in the editor below and click <strong>Save</strong> to add one.</p>`
		},
		{
			Hash: 'DataBeacon-SavedQueriesList-Table',
			Template: /*html*/`
<table class="data-table">
	<thead><tr><th>Name</th><th>Tags</th><th>Connection</th><th>Updated</th><th>Last Run</th><th>Rows</th><th>Actions</th></tr></thead>
	<tbody>{~TS:DataBeacon-SavedQueriesList-Row:AppData.SavedQueries.List~}</tbody>
</table>`
		},
		{
			Hash: 'DataBeacon-SavedQueriesList-Row',
			Template: /*html*/`
<tr class="databeacon-saved-row {~D:Record.ActiveClass~}">
	<td>
		<div class="databeacon-saved-name">{~D:Record.Name~}</div>
		<div class="databeacon-saved-docpreview">{~D:Record.DocumentationPreview~}</div>
	</td>
	<td>{~D:Record.TagsDisplay~}</td>
	<td>{~D:Record.ConnectionLabel~}</td>
	<td>{~D:Record.DateUpdatedDisplay~}</td>
	<td>{~D:Record.DateLastRunDisplay~}</td>
	<td>{~D:Record.LastRowCountDisplay~}</td>
	<td class="actions-cell">
		<a class="btn btn-small btn-primary" href="#/saved-queries/{~D:Record.GUIDSavedQuery~}/load">
			<span data-databeacon-icon="play" data-icon-size="14"></span> Load
		</a>
		<a class="btn btn-small btn-secondary" href="#/saved-queries/{~D:Record.GUIDSavedQuery~}/edit">
			<span data-databeacon-icon="info" data-icon-size="14"></span> Edit
		</a>
		<a class="btn btn-small btn-danger" href="#/saved-queries/{~D:Record.GUIDSavedQuery~}/delete">
			<span data-databeacon-icon="trash" data-icon-size="14"></span> Delete
		</a>
	</td>
</tr>`
		},
		{
			Hash: 'DataBeacon-SavedQueryForm-Body',
			Template: /*html*/`
<div class="databeacon-saved-form-grid">
	<div class="full">
		<label for="databeacon-savedform-name">Name</label>
		<input type="text" id="databeacon-savedform-name" value="{~D:AppData.SavedQueryForm.Name~}" placeholder="e.g. Active users in last 30 days" />
	</div>
	<div class="full">
		<label for="databeacon-savedform-doc">Documentation</label>
		<textarea id="databeacon-savedform-doc" placeholder="What does this query do? Parameters, edge cases, notes.">{~D:AppData.SavedQueryForm.Documentation~}</textarea>
	</div>
	<div>
		<label for="databeacon-savedform-tags">Tags / Folder (comma-separated)</label>
		<input type="text" id="databeacon-savedform-tags" value="{~D:AppData.SavedQueryForm.TagsDisplay~}" placeholder="analytics, users" />
	</div>
	<div>
		<label for="databeacon-savedform-conn">Associated Connection</label>
		<select id="databeacon-savedform-conn">
			<option value="">— None —</option>
			{~TS:DataBeacon-SavedQueryForm-ConnectionOption:AppData.SavedQueryForm.ConnectionOptions~}
		</select>
	</div>
	<div class="full">
		<label>SQL</label>
		<div class="databeacon-saved-form-sqlpreview">{~D:AppData.SavedQueryForm.SQLDisplay~}</div>
	</div>
</div>`
		},
		{
			Hash: 'DataBeacon-SavedQueryForm-ConnectionOption',
			Template: `<option value="{~D:Record.IDBeaconConnection~}" {~D:Record.SelectedAttr~}>{~D:Record.Label~}</option>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-SavedQueriesList',
			TemplateHash: 'DataBeacon-SavedQueriesList-Template',
			ContentDestinationAddress: '#DataBeacon-SavedQueries-Slot',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconSavedQueriesList extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-SavedQueries-Root');

		this.pict.CSSMap.injectCSS();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	// ── Router-handler entry points (called by Application) ────────────────
	_togglePanel()
	{
		let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
		if (tmpProvider && typeof tmpProvider.toggleExpanded === 'function') { tmpProvider.toggleExpanded(); }
	}
	_editQuery(pGUID)   { this.openEditModal(pGUID); }
	_deleteQuery(pGUID) { this._deleteRecord(pGUID); }

	_loadRecord(pGUID)
	{
		let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
		let tmpRecord = tmpProvider ? tmpProvider.get(pGUID) : null;
		if (!tmpRecord) return;
		// Push SQL into editor + active-query pointer.
		let tmpEditor = this.pict.views.SQLEditor;
		if (tmpEditor && typeof tmpEditor.setCode === 'function')
		{
			tmpEditor.setCode(tmpRecord.SQL || '');
		}
		if (!this.pict.AppData.QueryPanel) this.pict.AppData.QueryPanel = { SQL: '' };
		this.pict.AppData.QueryPanel.SQL = tmpRecord.SQL || '';
		tmpProvider.setActiveGUID(pGUID);
		// Auto-select the associated connection, if any.
		if (tmpRecord.IDBeaconConnection !== null && tmpRecord.IDBeaconConnection !== undefined)
		{
			this.pict.AppData.SelectedConnectionID = tmpRecord.IDBeaconConnection;
			let tmpDBProvider = this.pict.providers.DataBeaconProvider;
			if (tmpDBProvider && typeof tmpDBProvider.refreshIntrospectionViewData === 'function')
			{
				tmpDBProvider.refreshIntrospectionViewData();
			}
		}
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		if (tmpModal && typeof tmpModal.toast === 'function')
		{
			tmpModal.toast(`Loaded “${tmpRecord.Name}” into the editor.`, { type: 'success' });
		}
	}

	_deleteRecord(pGUID)
	{
		let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
		let tmpRecord = tmpProvider ? tmpProvider.get(pGUID) : null;
		if (!tmpRecord) return;
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		if (!tmpModal || typeof tmpModal.confirm !== 'function')
		{
			tmpProvider.remove(pGUID);
			return;
		}
		tmpModal.confirm(`Delete saved query “${tmpRecord.Name}”?`,
		{
			title: 'Delete Saved Query',
			confirmLabel: 'Delete',
			cancelLabel: 'Cancel',
			dangerous: true
		}).then((pConfirmed) =>
		{
			if (pConfirmed) tmpProvider.remove(pGUID);
		});
	}

	// ================================================================
	// Save / Edit form modal (shared entry — QueryPanel calls openSaveModal)
	// ================================================================

	/**
	 * Open the save modal. If pSQL is provided it will be used as the SQL
	 * to persist (Save case from QueryPanel). If pGUID is provided and
	 * matches a saved record, the form pre-fills from it and defaults to
	 * updating that record (unless pForceNew is true).
	 *
	 * @param {Object} pOptions
	 * @param {string} [pOptions.GUID]     - Existing GUID when updating.
	 * @param {string} [pOptions.SQL]      - Override SQL; defaults to the record's SQL (Edit) or current editor text (Save).
	 * @param {boolean} [pOptions.EditMetadataOnly] - true = Edit mode (SQL read-only, metadata only); false = Save mode (SQL becomes record's SQL).
	 */
	openSaveFormModal(pOptions)
	{
		let tmpOptions = pOptions || {};
		this._openForm(
		{
			Mode: tmpOptions.EditMetadataOnly ? 'edit' : 'save',
			GUID: tmpOptions.GUID || null,
			SQL: typeof tmpOptions.SQL === 'string' ? tmpOptions.SQL : ''
		});
	}

	openEditModal(pGUID)
	{
		let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
		let tmpRecord = tmpProvider ? tmpProvider.get(pGUID) : null;
		if (!tmpRecord) return;
		this._openForm({ Mode: 'edit', GUID: pGUID, SQL: tmpRecord.SQL });
	}

	_openForm(pContext)
	{
		let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		if (!tmpProvider || !tmpModal) return;

		let tmpExisting = (pContext.GUID) ? tmpProvider.get(pContext.GUID) : null;
		let tmpIsEdit = (pContext.Mode === 'edit');
		let tmpTitle = tmpIsEdit ? 'Edit Saved Query' : (tmpExisting ? 'Save Query' : 'Save Query');

		// Seed the form's AppData branch so the template can read it.
		this.pict.AppData.SavedQueryForm =
		{
			Mode: pContext.Mode,
			GUID: pContext.GUID,
			Name: (tmpExisting && tmpExisting.Name) || '',
			Documentation: (tmpExisting && tmpExisting.Documentation) || '',
			TagsDisplay: (tmpExisting && Array.isArray(tmpExisting.Tags)) ? tmpExisting.Tags.join(', ') : '',
			SelectedConnectionID: (tmpExisting && tmpExisting.IDBeaconConnection !== undefined)
				? tmpExisting.IDBeaconConnection
				: (this.pict.AppData.SelectedConnectionID || null),
			SQLDisplay: pContext.SQL || (tmpExisting && tmpExisting.SQL) || '',
			ConnectionOptions: this._buildConnectionOptions(
				(tmpExisting && tmpExisting.IDBeaconConnection !== undefined) ? tmpExisting.IDBeaconConnection : (this.pict.AppData.SelectedConnectionID || null)
			)
		};

		let tmpContent = this.pict.parseTemplateByHash('DataBeacon-SavedQueryForm-Body', null);

		let tmpButtons;
		if (tmpIsEdit)
		{
			tmpButtons = [
				{ Hash: 'save', Label: 'Save Changes', Style: 'primary' },
				{ Hash: 'cancel', Label: 'Cancel', Style: 'secondary' }
			];
		}
		else if (tmpExisting)
		{
			// Save-with-loaded-query: offer both update-in-place and save-as-new.
			tmpButtons = [
				{ Hash: 'save-update', Label: 'Save Changes', Style: 'primary' },
				{ Hash: 'save-new', Label: 'Save as New', Style: 'secondary' },
				{ Hash: 'cancel', Label: 'Cancel', Style: 'secondary' }
			];
		}
		else
		{
			tmpButtons = [
				{ Hash: 'save-new', Label: 'Save', Style: 'primary' },
				{ Hash: 'cancel', Label: 'Cancel', Style: 'secondary' }
			];
		}

		// After the modal renders, fill icon placeholders that may be inside the form body.
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		tmpModal.show(
		{
			title: tmpTitle,
			content: tmpContent,
			width: '620px',
			closeable: true,
			buttons: tmpButtons,
			onOpen: () => { if (tmpIcons) tmpIcons.injectIconPlaceholders('body'); }
		}).then((pButtonHash) =>
		{
			if (!pButtonHash || pButtonHash === 'cancel') return;
			this._applyFormSubmission(pButtonHash, pContext, tmpExisting);
		});
	}

	_applyFormSubmission(pButtonHash, pContext, pExisting)
	{
		let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
		if (!tmpProvider) return;

		let tmpName = this._readValue('#databeacon-savedform-name', (pExisting && pExisting.Name) || '');
		let tmpDoc = this._readValue('#databeacon-savedform-doc', (pExisting && pExisting.Documentation) || '');
		let tmpTagsRaw = this._readValue('#databeacon-savedform-tags', '');
		let tmpConnRaw = this._readValue('#databeacon-savedform-conn', '');
		let tmpConnID = (tmpConnRaw === '' || tmpConnRaw === null) ? null : parseInt(tmpConnRaw, 10);
		if (isNaN(tmpConnID)) tmpConnID = null;

		if (pButtonHash === 'save-update' && pExisting)
		{
			tmpProvider.update(pExisting.GUIDSavedQuery,
			{
				Name: tmpName,
				Documentation: tmpDoc,
				Tags: tmpTagsRaw,
				IDBeaconConnection: tmpConnID,
				SQL: pContext.SQL
			});
			tmpProvider.setActiveGUID(pExisting.GUIDSavedQuery);
		}
		else if (pButtonHash === 'save-new')
		{
			let tmpNew = tmpProvider.create(
			{
				Name: tmpName,
				Documentation: tmpDoc,
				Tags: tmpTagsRaw,
				IDBeaconConnection: tmpConnID,
				SQL: pContext.SQL
			});
			if (tmpNew) tmpProvider.setActiveGUID(tmpNew.GUIDSavedQuery);
		}
		else if (pButtonHash === 'save' && pContext.Mode === 'edit' && pExisting)
		{
			// Edit mode — metadata only, SQL is not touched.
			tmpProvider.update(pExisting.GUIDSavedQuery,
			{
				Name: tmpName,
				Documentation: tmpDoc,
				Tags: tmpTagsRaw,
				IDBeaconConnection: tmpConnID
			});
		}
	}

	_readValue(pSelector, pFallback)
	{
		let tmpList = this.pict.ContentAssignment.getElement(pSelector);
		if (!tmpList || tmpList.length === 0) return pFallback || '';
		let tmpVal = tmpList[0].value;
		return (typeof tmpVal === 'string') ? tmpVal : (pFallback || '');
	}

	_buildConnectionOptions(pSelectedID)
	{
		let tmpConns = this.pict.AppData.Connections || [];
		let tmpOut = [];
		for (let i = 0; i < tmpConns.length; i++)
		{
			tmpOut.push(
			{
				IDBeaconConnection: tmpConns[i].IDBeaconConnection,
				Label: `${tmpConns[i].Name} (${tmpConns[i].Type})`,
				SelectedAttr: (tmpConns[i].IDBeaconConnection === pSelectedID) ? 'selected' : ''
			});
		}
		return tmpOut;
	}
}

module.exports = PictViewDataBeaconSavedQueriesList;
module.exports.default_configuration = _ViewConfiguration;
