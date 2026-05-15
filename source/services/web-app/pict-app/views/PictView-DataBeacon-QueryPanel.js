/**
 * DataBeacon QueryPanel View
 *
 * SQL input (pict-section-code CodeJar editor, SQL syntax highlighting) +
 * Execute button + result table. Operates against the currently selected
 * connection (AppData.SelectedConnectionID). Results are stashed into
 * AppData.QueryPanel.* by the view before rendering the results area.
 *
 * The editor instance lives in the 'SQLEditor' view (registered in the
 * application) and is mounted into this view's editor slot on every render.
 * Because QueryPanel's root is replaced on each render, the editor's
 * CodeJar instance is destroyed and the initial-render flag is reset so
 * pict-section-code reinitialises cleanly into the fresh target div.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'QueryPanel',
	DefaultRenderable: 'DataBeacon-QueryPanel',
	DefaultDestinationAddress: '#DataBeacon-QueryPanel-Slot',
	AutoRender: false,

	CSS: /*css*/`
		#DataBeacon-QueryPanel-Editor { min-height: 140px; }
		#DataBeacon-QueryPanel-Editor .pict-code-editor-wrap
		{
			border: 1px solid var(--theme-color-border-default, #808080);
			border-radius: 4px;
			background: var(--theme-color-background-input, var(--theme-color-background-panel, #ffffff));
		}
		#DataBeacon-QueryPanel-Editor .pict-code-editor
		{
			background: var(--theme-color-background-input, var(--theme-color-background-panel, #ffffff)) !important;
			color: var(--theme-color-text-primary, #1a1a1a) !important;
			font-family: 'SFMono-Regular', 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
			font-size: 13px;
			min-height: 120px;
		}
		#DataBeacon-QueryPanel-Editor .pict-code-line-numbers
		{
			background: var(--theme-color-background-panel, #fffbf0) !important;
			color: var(--theme-color-text-muted, #7a7a7a) !important;
			border-right: 1px solid var(--theme-color-border-default, #808080) !important;
		}
		#DataBeacon-QueryPanel-Editor .keyword { color: var(--theme-color-brand-primary, #000080); font-weight: 600; }
		#DataBeacon-QueryPanel-Editor .string { color: var(--theme-color-status-success, #008000); }
		#DataBeacon-QueryPanel-Editor .number { color: var(--theme-color-status-warning, #808000); }
		#DataBeacon-QueryPanel-Editor .comment { color: var(--theme-color-text-muted, #7a7a7a); font-style: italic; }
		#DataBeacon-QueryPanel-Editor .operator { color: var(--theme-color-status-info, #000080); }
		#DataBeacon-QueryPanel-Editor .function-name { color: var(--theme-color-status-info, #000080); }
		#DataBeacon-QueryPanel-Root .databeacon-export-bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 10px; }
		#DataBeacon-QueryPanel-Root .databeacon-export-bar .databeacon-export-label { color: var(--theme-color-text-muted, #7a7a7a); font-size: 12px; margin-right: 4px; }
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-QueryPanel-Template',
			Template: /*html*/`
<div id="DataBeacon-QueryPanel-Root" class="section">
	<h2>Query Panel</h2>
	<div class="form-group">
		<label>{~D:AppData.QueryPanel.EditorLabel:SQL (SELECT only)~}</label>
		<div id="DataBeacon-QueryPanel-Editor"></div>
		<div class="help-text" id="DataBeacon-QueryPanel-EditorHint">{~D:AppData.QueryPanel.EditorHint~}</div>
	</div>
	<div class="button-row">
		<a class="btn btn-primary" href="#/queries/execute">
			<span data-databeacon-icon="play" data-icon-size="16"></span>
			Execute
		</a>
		<a class="btn btn-secondary" href="#/queries/save">
			<span data-databeacon-icon="save" data-icon-size="16"></span>
			Save…
		</a>
	</div>
	<div id="DataBeacon-QueryPanel-Results"></div>
</div>`
		},
		{
			Hash: 'DataBeacon-QueryPanel-ResultsTable',
			Template: /*html*/`
<div class="table-scroll">
	<table class="data-table">
		<thead><tr>{~TS:DataBeacon-QueryPanel-HeaderCell:AppData.QueryPanel.ColumnList~}</tr></thead>
		<tbody>{~TS:DataBeacon-QueryPanel-Row:AppData.QueryPanel.Rows~}</tbody>
	</table>
</div>
{~TemplateIfAbsolute:DataBeacon-QueryPanel-TruncationNote:AppData.QueryPanel:AppData.QueryPanel.IsTruncated^TRUE^x~}
{~Template:DataBeacon-QueryPanel-ExportBar:~}`
		},
		{
			Hash: 'DataBeacon-QueryPanel-ExportBar',
			Template: /*html*/`
<div class="databeacon-export-bar">
	<span class="databeacon-export-label">Export result:</span>
	<a class="btn btn-small btn-secondary" href="#/queries/export/json">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON
	</a>
	<a class="btn btn-small btn-secondary" href="#/queries/export/json-comp">
		<span data-databeacon-icon="download" data-icon-size="14"></span> JSON Comprehension
	</a>
	<a class="btn btn-small btn-secondary" href="#/queries/export/csv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> CSV
	</a>
	<a class="btn btn-small btn-secondary" href="#/queries/export/tsv">
		<span data-databeacon-icon="download" data-icon-size="14"></span> TSV
	</a>
</div>`
		},
		{
			Hash: 'DataBeacon-QueryPanel-HeaderCell',
			Template: `<th>{~D:Record.Name~}</th>`
		},
		{
			Hash: 'DataBeacon-QueryPanel-Row',
			Template: `<tr>{~TS:DataBeacon-QueryPanel-Cell:Record.Cells~}</tr>`
		},
		{
			Hash: 'DataBeacon-QueryPanel-Cell',
			Template: `<td>{~D:Record.CellHTML~}</td>`
		},
		{
			Hash: 'DataBeacon-QueryPanel-TruncationNote',
			Template: `<p class="help-text">Showing {~D:AppData.QueryPanel.DisplayCount~} of {~D:AppData.QueryPanel.TotalCount~}</p>`
		},
		{
			Hash: 'DataBeacon-QueryPanel-EmptyResults',
			Template: `<p class="empty-state">No results.</p>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-QueryPanel',
			TemplateHash: 'DataBeacon-QueryPanel-Template',
			ContentDestinationAddress: '#DataBeacon-QueryPanel-Slot',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconQueryPanel extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onBeforeRender(pRenderable)
	{
		// Refresh the editor label/hint/language metadata based on the
		// current connection type so the declarative template bindings
		// (`AppData.QueryPanel.EditorLabel` etc.) have the latest values
		// before the root renders.
		this._applyDriverProfile();
		return super.onBeforeRender(pRenderable);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-QueryPanel-Root');

		// QueryPanel's root DOM is replaced on every render, so a previously
		// mounted CodeJar instance is orphaned against a detached div.
		// Tear it down (if present) and rebuild into the fresh target.
		this._mountEditor();

		this.pict.CSSMap.injectCSS();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_mountEditor()
	{
		let tmpEditor = this.pict.views.SQLEditor;
		if (!tmpEditor) return;
		// Align CodeJar's language BEFORE (re)creating its instance so the
		// appropriate highlighter is compiled at init time.
		let tmpLanguage = this._resolveEditorLanguage();
		if (tmpEditor._language !== tmpLanguage && typeof tmpEditor.setLanguage === 'function')
		{
			try { tmpEditor.setLanguage(tmpLanguage); }
			catch (pError) { tmpEditor._language = tmpLanguage; }
		}
		if (tmpEditor.codeJar) tmpEditor.destroy();
		tmpEditor.initialRenderComplete = false;
		tmpEditor.render();
		// Wire a defensive Enter handler that guarantees a '\n' insertion in
		// every browser. In Firefox >= 136, contentEditable="plaintext-only"
		// is disabled and CodeJar's legacy fallback only triggers when its
		// indent branch doesn't match — non-indent Enter keys fall through
		// to the browser's default, which on some platforms splits the line
		// into <div> wrappers whose textContent doesn't preserve newlines.
		// Handling Enter explicitly in the capture phase bypasses that.
		this._wireEnterSafety();
	}

	_wireEnterSafety()
	{
		let tmpEditor = this.pict.views.SQLEditor;
		if (!tmpEditor || !tmpEditor._editorElement) return;
		let tmpEl = tmpEditor._editorElement;

		// Guaranteed-newline Enter handler. Some browsers insert <br> or <div>
		// on Enter even when contenteditable is plaintext-only; when CodeJar's
		// highlighter re-renders innerHTML from textContent, those non-'\n'
		// structures collapse and the visual line break disappears ("line
		// numbers don't increment, typing another char joins them back").
		// Inserting a literal '\n' as a Text node bypasses the browser's
		// default Enter behavior entirely.
		let fHandler = (pEvent) =>
		{
			if (pEvent.key !== 'Enter') return;
			if (pEvent.defaultPrevented) return;
			if (pEvent.ctrlKey || pEvent.metaKey || pEvent.altKey) return;

			pEvent.preventDefault();
			pEvent.stopPropagation();
			pEvent.stopImmediatePropagation();

			let tmpPadding = this._computeCurrentLinePadding(tmpEl);
			// When Enter lands at end-of-content, the next keystroke would
			// otherwise target a DOM "flag" position (between-nodes) which
			// Chrome resolves into the preceding span — the next character
			// appears joined to the previous line. Mirror the browser's
			// own end-of-content placeholder pattern: insert '\n\n' when
			// there's nothing after the cursor, and pin the caret between
			// the two newlines. CodeJar's highlighter then re-renders into
			// a single trailing text node whose contents are addressable.
			let tmpAtEnd = this._isCursorAtEnd(tmpEl);
			let tmpInsert = '\n' + tmpPadding + (tmpAtEnd ? '\n' : '');
			let tmpInserted = this._manualInsertText(tmpEl, tmpInsert);
			if (tmpAtEnd && tmpInserted)
			{
				this._placeCaretInTextNode(tmpInserted, tmpPadding.length + 1);
			}

			// Do NOT call codeJar.updateCode here — it resets textContent
			// which loses the cursor position we just placed. CodeJar's
			// keyup handler (unaffected by our keydown preventDefault) will
			// fire debounceHighlight + onUpdate shortly; that drives line
			// numbers and the AppData write through the normal path.
		};
		tmpEl.addEventListener('keydown', fHandler, true);
	}

	// ── Caret / text-node helpers ──────────────────────────────────────────
	// The methods below manipulate Selection / Range / TextNode directly via
	// the browser DOM.  ContentAssignment's abstractions don't cover caret
	// position or in-place text splicing, so these fall under the pict
	// "DOM access unless absolutely necessary" carve-out (rich text input
	// behavior).  Keep them scoped to CodeJar's contenteditable root only.

	_computeCurrentLinePadding(pEditor)
	{
		let tmpSel = window.getSelection();
		if (!tmpSel || tmpSel.rangeCount === 0) return '';
		let tmpRange = tmpSel.getRangeAt(0);
		let tmpPre = document.createRange();
		tmpPre.selectNodeContents(pEditor);
		tmpPre.setEnd(tmpRange.startContainer, tmpRange.startOffset);
		let tmpText = tmpPre.toString();
		let tmpLineStart = tmpText.lastIndexOf('\n') + 1;
		let tmpLine = tmpText.substring(tmpLineStart);
		let tmpMatch = tmpLine.match(/^[ \t]*/);
		return tmpMatch ? tmpMatch[0] : '';
	}

	_manualInsertText(pEditor, pText)
	{
		let tmpSel = window.getSelection();
		if (!tmpSel || tmpSel.rangeCount === 0)
		{
			let tmpNode = document.createTextNode(pText);
			pEditor.appendChild(tmpNode);
			return tmpNode;
		}
		let tmpRange = tmpSel.getRangeAt(0);
		tmpRange.deleteContents();
		let tmpNode = document.createTextNode(pText);
		tmpRange.insertNode(tmpNode);
		// Place caret INSIDE the newly-inserted text node at its end by
		// default. Caller may reposition via _placeCaretInTextNode.
		let tmpCollapse = document.createRange();
		tmpCollapse.setStart(tmpNode, tmpNode.length);
		tmpCollapse.setEnd(tmpNode, tmpNode.length);
		tmpSel.removeAllRanges();
		tmpSel.addRange(tmpCollapse);
		return tmpNode;
	}

	_placeCaretInTextNode(pTextNode, pOffset)
	{
		if (!pTextNode || pTextNode.nodeType !== Node.TEXT_NODE) return;
		let tmpSel = window.getSelection();
		if (!tmpSel) return;
		let tmpOffset = Math.max(0, Math.min(pOffset, pTextNode.length));
		let tmpRange = document.createRange();
		tmpRange.setStart(pTextNode, tmpOffset);
		tmpRange.setEnd(pTextNode, tmpOffset);
		tmpSel.removeAllRanges();
		tmpSel.addRange(tmpRange);
	}

	_isCursorAtEnd(pEditor)
	{
		let tmpSel = window.getSelection();
		if (!tmpSel || tmpSel.rangeCount === 0) return true;
		let tmpRange = tmpSel.getRangeAt(0);
		let tmpAfter = document.createRange();
		tmpAfter.selectNodeContents(pEditor);
		tmpAfter.setStart(tmpRange.endContainer, tmpRange.endOffset);
		return tmpAfter.toString().length === 0;
	}


	// ── Router-handler entry points (called by Application) ────────────────
	// `#/queries/execute`, `#/queries/save`, `#/queries/export/:format` each
	// resolve to one of these methods through PictApplication.
	_executeQuery()                 { return this._execute(); }
	_saveQuery()                    { return this._openSaveModal(); }
	_exportQueryResult(pFormat)     { return this._export(pFormat); }

	_openSaveModal()
	{
		let tmpList = this.pict.views.SavedQueriesList;
		let tmpProvider = this.pict.providers['DataBeacon-SavedQueries'];
		if (!tmpList || !tmpProvider) return;
		let tmpSQL = this._readSQL();
		let tmpActiveGUID = tmpProvider.getActiveGUID();
		tmpList.openSaveFormModal(
		{
			GUID: tmpActiveGUID,
			SQL: tmpSQL,
			EditMetadataOnly: false
		});
	}

	_export(pFormat)
	{
		let tmpExport = this.pict.providers['DataBeacon-Export'];
		if (!tmpExport) return;
		let tmpQP = this.pict.AppData.QueryPanel || {};
		let tmpRows = Array.isArray(tmpQP.RawRows) ? tmpQP.RawRows : [];
		if (tmpRows.length === 0) return;

		// Query results have no table-of-origin — autodetect a Comprehension
		// key by looking for Meadow's GUID${Entity} convention. Any column
		// whose name starts with "GUID" wins; otherwise fall through to the
		// exporter's 1-based row-index fallback.
		let tmpKeyField = null;
		if (tmpRows[0] && typeof tmpRows[0] === 'object')
		{
			let tmpKeys = Object.keys(tmpRows[0]);
			for (let k = 0; k < tmpKeys.length; k++)
			{
				if (/^GUID[A-Z]/.test(tmpKeys[k])) { tmpKeyField = tmpKeys[k]; break; }
			}
		}
		tmpExport.exportRows(pFormat, tmpRows,
		{
			BaseName: 'query-result',
			EntityName: 'QueryResult',
			KeyField: tmpKeyField
		});
	}

	_readSQL()
	{
		let tmpEditor = this.pict.views.SQLEditor;
		if (tmpEditor && typeof tmpEditor.getCode === 'function')
		{
			let tmpCode = tmpEditor.getCode();
			if (typeof tmpCode === 'string' && tmpCode.length > 0) return tmpCode;
		}
		// Fallback to the data-bound AppData address in case the editor was
		// never initialised (headless context, no CodeJar, etc.).
		let tmpAppData = this.pict.AppData.QueryPanel || {};
		return (typeof tmpAppData.SQL === 'string') ? tmpAppData.SQL : '';
	}

	_execute()
	{
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		let tmpSQL = this._readSQL().trim();
		let tmpCID = this.pict.AppData.SelectedConnectionID;

		if (!tmpSQL)
		{
			let tmpProfile = this._currentDriverProfile();
			let tmpMessage = tmpProfile.IsSQL ? 'Please enter a SQL query.' : `Please enter a ${tmpProfile.Label} query.`;
			if (tmpModal) tmpModal.toast(tmpMessage, { type: 'warning' });
			return;
		}
		if (!tmpCID)
		{
			if (tmpModal) tmpModal.toast('Select a connection in Introspection first.', { type: 'warning' });
			return;
		}

		let tmpProvider = this.pict.providers.DataBeaconProvider;
		tmpProvider.executeQuery(tmpCID, tmpSQL, (pError, pData) =>
		{
			let tmpResultsSelector = '#DataBeacon-QueryPanel-Results';

			if (pError || !pData || !pData.Success)
			{
				let tmpMessage = pData ? pData.Error : (pError ? pError.message : 'Unknown error');
				this.pict.ContentAssignment.assignContent(
					tmpResultsSelector,
					`<p class="error">${tmpProvider.escapeHTML ? tmpProvider.escapeHTML(tmpMessage) : tmpMessage}</p>`
				);
				return;
			}

			let tmpRows = pData.Rows || [];
			if (tmpRows.length === 0)
			{
				let tmpHTML = this.pict.parseTemplateByHash('DataBeacon-QueryPanel-EmptyResults', null);
				this.pict.ContentAssignment.assignContent(tmpResultsSelector, tmpHTML);
				return;
			}

			this.pict.AppData.QueryPanel = Object.assign({}, this.pict.AppData.QueryPanel,
				tmpProvider.buildQueryResultViewData(tmpRows));
			let tmpHTML = this.pict.parseTemplateByHash('DataBeacon-QueryPanel-ResultsTable', null);
			this.pict.ContentAssignment.assignContent(tmpResultsSelector, tmpHTML);
			// The results fragment contains fresh data-databeacon-icon
			// placeholders (export-bar buttons) — fill them in now since
			// the view's initial icon pass ran before these elements existed.
			let tmpIcons = this.pict.providers['DataBeacon-Icons'];
			if (tmpIcons) tmpIcons.injectIconPlaceholders('#DataBeacon-QueryPanel-Root');

			// If a saved query is currently loaded, record this successful
			// execution on it (timestamp + row count).
			let tmpSavedProvider = this.pict.providers['DataBeacon-SavedQueries'];
			if (tmpSavedProvider)
			{
				let tmpGUID = tmpSavedProvider.getActiveGUID();
				if (tmpGUID) tmpSavedProvider.noteRun(tmpGUID, tmpRows.length);
			}
		});
	}

	// ================================================================
	// Driver-aware editor profile (SQL vs Mongo/Solr/RocksDB JSON)
	// ================================================================

	_currentDriverProfile()
	{
		let tmpConn = this._currentConnection();
		let tmpType = tmpConn ? tmpConn.Type : null;
		switch (tmpType)
		{
			case 'MongoDB':
				return {
					Type: 'MongoDB',
					IsSQL: false,
					Language: 'json',
					Label: 'MongoDB (JSON descriptor)',
					Hint: 'Example: {"op":"find","collection":"users","filter":{"active":true},"limit":50} · also supports "aggregate" and "runCommand"'
				};
			case 'Solr':
				return {
					Type: 'Solr',
					IsSQL: false,
					Language: 'json',
					Label: 'Solr (JSON descriptor or query string)',
					Hint: 'JSON: {"q":"title:foo","rows":50} · or raw: q=title:foo&rows=50'
				};
			case 'RocksDB':
				return {
					Type: 'RocksDB',
					IsSQL: false,
					Language: 'json',
					Label: 'RocksDB (JSON descriptor)',
					Hint: 'Example: {"op":"scan","start":"user/","end":"user/~","limit":50} · also supports {"op":"get","key":"user/1"}'
				};
			case 'MySQL':
			case 'PostgreSQL':
			case 'MSSQL':
			case 'SQLite':
			default:
				return {
					Type: tmpType || 'SQL',
					IsSQL: true,
					Language: 'sql',
					Label: 'SQL (SELECT only)',
					Hint: 'SELECT ... — other statement types are rejected server-side.'
				};
		}
	}

	_resolveEditorLanguage()
	{
		return this._currentDriverProfile().Language;
	}

	_applyDriverProfile()
	{
		let tmpProfile = this._currentDriverProfile();
		if (!this.pict.AppData.QueryPanel) this.pict.AppData.QueryPanel = { SQL: '' };
		this.pict.AppData.QueryPanel.EditorLabel = tmpProfile.Label;
		this.pict.AppData.QueryPanel.EditorHint = tmpProfile.Hint;
		this.pict.AppData.QueryPanel.EditorLanguage = tmpProfile.Language;
		this.pict.AppData.QueryPanel.DriverType = tmpProfile.Type;
	}

	_currentConnection()
	{
		let tmpID = this.pict.AppData.SelectedConnectionID;
		if (tmpID === null || tmpID === undefined) return null;
		let tmpConns = this.pict.AppData.Connections || [];
		for (let i = 0; i < tmpConns.length; i++)
		{
			if (tmpConns[i].IDBeaconConnection === tmpID) return tmpConns[i];
		}
		return null;
	}
}

module.exports = PictViewDataBeaconQueryPanel;
module.exports.default_configuration = _ViewConfiguration;
