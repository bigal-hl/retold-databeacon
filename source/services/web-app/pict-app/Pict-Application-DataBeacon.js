/**
 * Retold DataBeacon — Pict Application
 *
 * Main web application class for the DataBeacon web UI. Registers
 * providers and views; boots AppData; delegates navigation to the
 * Layout view.
 */
const libPictApplication = require('pict-application');
const libPictSectionModal = require('pict-section-modal');
const libPictSectionTheme = require('pict-section-theme');
const libPictSectionCode = require('pict-section-code');
const libPictSectionConnectionForm = require('pict-section-connection-form');
const libPictRouter = require('pict-router');
const libPictRouterConfig = require('./providers/PictRouter-DataBeacon-Configuration.json');
const libDataBeaconBrand = require('./DataBeacon-Brand.js');

const libDataBeaconProvider = require('./providers/Pict-Provider-DataBeacon.js');
const libDataBeaconIconsProvider = require('./providers/Pict-Provider-DataBeacon-Icons.js');
const libDataBeaconExportProvider = require('./providers/Pict-Provider-DataBeacon-Export.js');
const libDataBeaconSavedQueriesProvider = require('./providers/Pict-Provider-DataBeacon-SavedQueries.js');

// Shell + chrome views
const libViewLayout = require('./views/PictView-DataBeacon-Layout.js');
const libViewSidebar = require('./views/PictView-DataBeacon-Sidebar.js');
const libViewTopBarNav = require('./views/PictView-DataBeacon-TopBar-Nav.js');
const libViewTopBarUser = require('./views/PictView-DataBeacon-TopBar-User.js');
const libViewSettingsPanel = require('./views/PictView-DataBeacon-SettingsPanel.js');

// Page / container views
const libViewDashboard = require('./views/PictView-DataBeacon-Dashboard.js');
const libViewConnections = require('./views/PictView-DataBeacon-Connections.js');
const libViewIntrospection = require('./views/PictView-DataBeacon-Introspection.js');
const libViewEndpoints = require('./views/PictView-DataBeacon-Endpoints.js');
const libViewRecords = require('./views/PictView-DataBeacon-Records.js');
const libViewSQL = require('./views/PictView-DataBeacon-SQL.js');

// Sub-views composed into the container pages
const libViewConnectionForm = require('./views/PictView-DataBeacon-ConnectionForm.js');
const libViewConnectionList = require('./views/PictView-DataBeacon-ConnectionList.js');
const libViewIntrospectionControls = require('./views/PictView-DataBeacon-IntrospectionControls.js');
const libViewIntrospectionTables = require('./views/PictView-DataBeacon-IntrospectionTables.js');
const libViewRecordBrowser = require('./views/PictView-DataBeacon-RecordBrowser.js');
const libViewQueryPanel = require('./views/PictView-DataBeacon-QueryPanel.js');
const libViewSavedQueriesList = require('./views/PictView-DataBeacon-SavedQueriesList.js');

class DataBeaconApplication extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'DataBeaconApplication';

		// Data + utility providers.
		this.pict.addProvider('DataBeaconProvider', libDataBeaconProvider.default_configuration, libDataBeaconProvider);
		this.pict.addProvider('DataBeacon-Icons', libDataBeaconIconsProvider.default_configuration, libDataBeaconIconsProvider);
		this.pict.addProvider('DataBeacon-Export', libDataBeaconExportProvider.default_configuration, libDataBeaconExportProvider);
		this.pict.addProvider('DataBeacon-SavedQueries', libDataBeaconSavedQueriesProvider.default_configuration, libDataBeaconSavedQueriesProvider);

		// pict-section-modal must exist before the Layout view calls shell().
		this.pict.addView('Pict-Section-Modal', libPictSectionModal.default_configuration, libPictSectionModal);

		// Slot + chrome views must be registered BEFORE the Theme-Section provider
		// — its bootstrap looks slot views up by hash when it wires Theme-TopBar.
		this.pict.addView('DataBeacon-TopBar-Nav',    libViewTopBarNav.default_configuration,    libViewTopBarNav);
		this.pict.addView('DataBeacon-TopBar-User',   libViewTopBarUser.default_configuration,   libViewTopBarUser);
		this.pict.addView('DataBeacon-Sidebar',       libViewSidebar.default_configuration,      libViewSidebar);
		this.pict.addView('DataBeacon-SettingsPanel', libViewSettingsPanel.default_configuration, libViewSettingsPanel);

		// Theme-Section: registers the Theme provider, mounts the bundled theme
		// catalog, wires localStorage persistence, applies the default theme,
		// and stamps the brand into the topbar's BrandMark + nav/user slots.
		this.pict.addProvider('Theme-Section',
		{
			ApplyDefault: 'retold-default',
			DefaultMode:  'system',
			DefaultScale: 1.0,
			Brand:        libDataBeaconBrand,
			Views:        ['Picker', 'ModeToggle', 'ScaleSelect', 'BrandMark', 'TopBar'],
			ViewOptions:
			{
				TopBar: { NavView: 'DataBeacon-TopBar-Nav', UserView: 'DataBeacon-TopBar-User', Height: 48 }
			}
		}, libPictSectionTheme);

		// Layout owns the shell; page views render into the workspace destinations
		// the layout's shell creates.
		this.pict.addView('Layout', libViewLayout.default_configuration, libViewLayout);
		this.pict.addView('Dashboard', libViewDashboard.default_configuration, libViewDashboard);
		this.pict.addView('Connections', libViewConnections.default_configuration, libViewConnections);
		this.pict.addView('Introspection', libViewIntrospection.default_configuration, libViewIntrospection);
		this.pict.addView('Endpoints', libViewEndpoints.default_configuration, libViewEndpoints);
		this.pict.addView('Records', libViewRecords.default_configuration, libViewRecords);
		this.pict.addView('SQL', libViewSQL.default_configuration, libViewSQL);

		// Sub-views
		this.pict.addView('ConnectionForm', libViewConnectionForm.default_configuration, libViewConnectionForm);
		this.pict.addView('ConnectionList', libViewConnectionList.default_configuration, libViewConnectionList);

		// Shared schema-driven connection form.  Renders the type
		// select + per-provider field block into the slot owned by
		// the ConnectionForm wrapper view.  The provider's
		// loadAvailableTypes() pumps schemas in once
		// /beacon/connection/schemas responds.
		this.pict.addView('PictSection-ConnectionForm',
			Object.assign({}, libPictSectionConnectionForm.default_configuration,
				{
					ContainerSelector:         '#DataBeacon-ConnectionForm-FieldsSlot',
					DefaultDestinationAddress: '#DataBeacon-ConnectionForm-FieldsSlot',
					SchemasAddress:            'AppData.ConnectionFormSchemas',
					ActiveAddress:             'AppData.ConnectionFormActiveProvider',
					FieldIDPrefix:             'databeacon-conn'
				}), libPictSectionConnectionForm);
		this.pict.addView('IntrospectionControls', libViewIntrospectionControls.default_configuration, libViewIntrospectionControls);
		this.pict.addView('IntrospectionTables', libViewIntrospectionTables.default_configuration, libViewIntrospectionTables);
		this.pict.addView('RecordBrowser', libViewRecordBrowser.default_configuration, libViewRecordBrowser);
		this.pict.addView('QueryPanel', libViewQueryPanel.default_configuration, libViewQueryPanel);
		this.pict.addView('SavedQueriesList', libViewSavedQueriesList.default_configuration, libViewSavedQueriesList);

		// SQL code editor (pict-section-code + CodeJar) — registered separately so the
		// QueryPanel view can mount it into its editor slot each time it renders.
		this.pict.addView('SQLEditor',
		{
			ViewIdentifier: 'SQLEditor',
			TargetElementAddress: '#DataBeacon-QueryPanel-Editor',
			Language: 'sql',
			LineNumbers: true,
			ReadOnly: false,
			CodeDataAddress: 'AppData.QueryPanel.SQL',
			DefaultCode: '',
			AutoRender: false
		}, libPictSectionCode);

		// Router -- Navigo in hash mode.  Every navigation and action in the
		// DataBeacon web app flows through `<a href="#/...">` anchors dispatched
		// via this router; there are no addEventListener callbacks in view
		// lifecycle hooks (pict-first imperative).
		this.pict.addProvider('PictRouter', libPictRouterConfig, libPictRouter);
	}

	onAfterInitializeAsync(fCallback)
	{
		// Set up application state.
		if (!this.pict.AppData) this.pict.AppData = {};
		this.pict.AppData.Connections = [];
		this.pict.AppData.AvailableTypes = [];
		this.pict.AppData.AvailableTypesForForm = [];
		this.pict.AppData.Tables = [];
		this.pict.AppData.Endpoints = [];
		this.pict.AppData.SelectedConnectionID = null;
		this.pict.AppData.SelectedTableName = null;
		this.pict.AppData.Records = [];
		this.pict.AppData.BeaconStatus = { Connected: false };
		this.pict.AppData.CurrentView = 'Dashboard';

		// Seed the view-shape AppData branches so the first render of each
		// screen has something to bind against (providers overwrite these
		// as soon as API responses arrive).
		this.pict.AppData.Dashboard =
		{
			TotalConnections: 0,
			ActiveConnections: 0,
			TotalEndpoints: 0,
			BeaconStatusLabel: 'Unknown',
			BeaconBadgeClass: 'badge-neutral',
			BeaconName: 'retold-databeacon',
			BeaconNameDisplay: '',
			ConnectionSummary: []
		};
		this.pict.AppData.Introspection =
		{
			ConnectedList: [],
			ShowPlaceholder: true,
			HasSelection: false,
			SelectedBanner: null,
			RunDisabled: true,
			AllDisabled: true,
			State: 'NoConnections',
			TablesView: [],
			TablesHeader: null,
			DetailModalColumns: []
		};
		this.pict.AppData.QueryPanel = { SQL: '' };
		this.pict.AppData.RecordBrowser =
		{
			TableOptions: [],
			PageSizeOptions: [],
			SelectedTableName: '',
			TableName: '',
			CursorStart: 0,
			PageSize: 50,
			PrevDisabled: true,
			NextDisabled: true,
			LoadDisabled: true,
			RangeLabel: '',
			State: 'NoSelection',
			ColumnList: [],
			Rows: []
		};

		// Topbar-driven AppData. PageTitle drives the section label rendered in
		// the Nav slot; setActiveView() updates it and re-renders the topbar.
		this.pict.AppData.DataBeacon = this.pict.AppData.DataBeacon || {};
		this.pict.AppData.DataBeacon.PageTitle = 'Dashboard';

		// Keep a window handle for legacy/debug access only; views do NOT rely on it.
		if (typeof window !== 'undefined') window.DataBeaconApp = this;

		// Render the shell.
		this.pict.views.Layout.render();

		// Load initial data.
		let tmpProvider = this.pict.providers.DataBeaconProvider;
		if (tmpProvider)
		{
			tmpProvider.loadConnections();
			tmpProvider.loadAvailableTypes();
			tmpProvider.loadEndpoints();
			tmpProvider.loadBeaconStatus();
		}

		// Land on the dashboard.
		this.navigateTo('Dashboard');

		return super.onAfterInitializeAsync(fCallback);
	}

	// ── Router action handlers ──────────────────────────────────────────────
	// Every `{~LV:Pict.PictApplication.method(...)~}` route target resolves
	// here.  Handlers are intentionally thin dispatchers into the owning
	// view or provider -- they exist so routes can be the single source of
	// truth for how actions fire, without every view shipping its own
	// event-delegation code.

	setActiveView(pViewName)
	{
		this.pict.AppData.CurrentView = pViewName;
		this.pict.AppData.DataBeacon = this.pict.AppData.DataBeacon || {};
		this.pict.AppData.DataBeacon.PageTitle = pViewName;
		if (this.pict.views.Layout && typeof this.pict.views.Layout.setActiveView === 'function')
		{
			this.pict.views.Layout.setActiveView(pViewName);
		}
		this.renderTopBar();
	}

	// Re-render the Theme-TopBar's nav + user slot views without touching the
	// shared Theme-TopBar chrome itself (its background, brand mark, etc.).
	renderTopBar()
	{
		let tmpNav  = this.pict.views['DataBeacon-TopBar-Nav'];
		let tmpUser = this.pict.views['DataBeacon-TopBar-User'];
		if (tmpNav  && typeof tmpNav.render  === 'function') { tmpNav.render(); }
		if (tmpUser && typeof tmpUser.render === 'function') { tmpUser.render(); }
	}

	// Legacy shim kept for window.DataBeaconApp.navigateTo() callers.  New
	// code should hit the route `#/view/<name>` anchors instead.
	navigateTo(pViewName) { return this.setActiveView(pViewName); }

	// ── Connections ─────────────────────────────────────────────────────────
	createConnection()                 { return this._form('ConnectionForm')._submit(); }
	connectConnection(pID)             { return this.pict.providers.DataBeaconProvider.connectConnection(parseInt(pID, 10)); }
	disconnectConnection(pID)          { return this.pict.providers.DataBeaconProvider.disconnectConnection(parseInt(pID, 10)); }
	testConnection(pID)
	{
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		this.pict.providers.DataBeaconProvider.testConnection(parseInt(pID, 10),
			(pErr, pData) =>
			{
				if (pData && pData.Success) { tmpModal.toast('Connection test succeeded.', { type: 'success' }); }
				else { tmpModal.toast('Connection test failed: ' + (pData ? pData.Error : 'Unknown error'), { type: 'error' }); }
			});
	}
	deleteConnection(pID)
	{
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		tmpModal.confirm('Are you sure you want to delete this connection?',
			{
				title: 'Delete Connection',
				confirmLabel: 'Delete',
				cancelLabel: 'Cancel',
				dangerous: true
			}).then((pConfirmed) =>
			{
				if (pConfirmed) { this.pict.providers.DataBeaconProvider.deleteConnection(parseInt(pID, 10)); }
			});
	}
	introspectConnection(pID)
	{
		let tmpID = parseInt(pID, 10);
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		this.pict.providers.DataBeaconProvider.introspect(tmpID,
			(pErr, pData) =>
			{
				if (pData && pData.Success)
				{
					this.pict.AppData.SelectedConnectionID = tmpID;
					this.setActiveView('Introspection');
				}
				else
				{
					tmpModal.toast('Introspection failed: ' + (pData ? pData.Error : 'Unknown error'), { type: 'error' });
				}
			});
	}

	// ── Introspection ───────────────────────────────────────────────────────
	runIntrospect()
	{
		let tmpView = this.pict.views.IntrospectionControls;
		if (tmpView && typeof tmpView._runIntrospect === 'function') { tmpView._runIntrospect(); }
	}
	introspectAll()
	{
		let tmpView = this.pict.views.IntrospectionControls;
		if (tmpView && typeof tmpView._introspectAll === 'function') { tmpView._introspectAll(); }
	}
	selectIntrospectionConnection(pID)
	{
		let tmpView = this.pict.views.IntrospectionControls;
		if (tmpView && typeof tmpView._selectConnection === 'function') { tmpView._selectConnection(pID); }
	}
	viewTable(pConnID, pTable)
	{
		let tmpView = this.pict.views.IntrospectionTables;
		if (tmpView && typeof tmpView._viewTableDetails === 'function') { tmpView._viewTableDetails(parseInt(pConnID, 10), pTable); }
	}

	// ── Endpoints ───────────────────────────────────────────────────────────
	refreshEndpoints()                 { return this.pict.providers.DataBeaconProvider.loadEndpoints(); }
	enableEndpoint(pConnID, pTable)    { return this.pict.providers.DataBeaconProvider.enableEndpoint(parseInt(pConnID, 10), pTable); }
	disableEndpoint(pConnID, pTable)   { return this.pict.providers.DataBeaconProvider.disableEndpoint(parseInt(pConnID, 10), pTable); }
	browseEndpoint(pTableName)
	{
		this.pict.AppData.SelectedTableName = pTableName;
		if (!this.pict.AppData.RecordBrowser) { this.pict.AppData.RecordBrowser = {}; }
		// Always restart paging from row 0 when jumping from Endpoints.
		this.pict.AppData.RecordBrowser.CursorStart = 0;
		let tmpPageSize = this.pict.AppData.RecordBrowser.PageSize || 50;
		this.setActiveView('Records');
		let tmpProv = this.pict.providers.DataBeaconProvider;
		if (tmpProv && typeof tmpProv.loadRecords === 'function') { tmpProv.loadRecords(pTableName, 0, tmpPageSize); }
	}

	// ── Records ─────────────────────────────────────────────────────────────
	recordsPrev()
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (tmpView && typeof tmpView._pagePrev === 'function') { tmpView._pagePrev(); }
	}
	recordsNext()
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (tmpView && typeof tmpView._pageNext === 'function') { tmpView._pageNext(); }
	}
	recordsLoad()
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (tmpView && typeof tmpView._loadCurrent === 'function') { tmpView._loadCurrent(); }
	}
	recordsExport(pFormat)
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (tmpView && typeof tmpView._exportRecords === 'function') { tmpView._exportRecords(pFormat); }
	}
	recordsExportAll(pFormat)
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (tmpView && typeof tmpView._exportAllRecords === 'function') { tmpView._exportAllRecords(pFormat); }
	}
	selectRecordsTable(pTableName)
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (tmpView && typeof tmpView._selectTable === 'function') { tmpView._selectTable(pTableName); }
	}
	changeRecordsPageSize(pSize)
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (tmpView && typeof tmpView._setPageSize === 'function') { tmpView._setPageSize(pSize); }
	}
	goToRecordsPage(pPage)
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (tmpView && typeof tmpView._goToPage === 'function') { tmpView._goToPage(pPage); }
	}
	applyRecordsFilter(pFilter)
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (!tmpView) { return; }
		// If no value arg is supplied (the Apply button's route doesn't carry
		// one; only the inline onchange does), read the filter input from the
		// DOM at dispatch time so the user's last keystrokes are captured.
		let tmpValue = (typeof pFilter === 'string') ? pFilter : this._domValue('#databeacon-records-filter');
		if (typeof tmpView._applyFilter === 'function') { tmpView._applyFilter(tmpValue || ''); }
	}
	clearRecordsFilter()
	{
		let tmpView = this.pict.views.RecordBrowser;
		if (tmpView && typeof tmpView._clearFilter === 'function') { tmpView._clearFilter(); }
	}

	_domValue(pSelector)
	{
		let tmpList = this.pict.ContentAssignment.getElement(pSelector);
		if (!tmpList || tmpList.length === 0) { return ''; }
		let tmpNode = (typeof tmpList.length === 'number' && !('value' in tmpList)) ? tmpList[0] : tmpList;
		return tmpNode && 'value' in tmpNode ? tmpNode.value : '';
	}

	// ── Queries ─────────────────────────────────────────────────────────────
	executeQuery()
	{
		let tmpView = this.pict.views.QueryPanel;
		if (tmpView && typeof tmpView._executeQuery === 'function') { tmpView._executeQuery(); }
	}
	saveQueryFromPanel()
	{
		let tmpView = this.pict.views.QueryPanel;
		if (tmpView && typeof tmpView._saveQuery === 'function') { tmpView._saveQuery(); }
	}
	queryExport(pFormat)
	{
		let tmpView = this.pict.views.QueryPanel;
		if (tmpView && typeof tmpView._exportQueryResult === 'function') { tmpView._exportQueryResult(pFormat); }
	}

	// ── Saved queries ───────────────────────────────────────────────────────
	toggleSavedPanel()
	{
		let tmpView = this.pict.views.SavedQueriesList;
		if (tmpView && typeof tmpView._togglePanel === 'function') { tmpView._togglePanel(); }
	}
	loadSavedQuery(pGUID)
	{
		let tmpView = this.pict.views.SavedQueriesList;
		if (tmpView && typeof tmpView._loadRecord === 'function') { tmpView._loadRecord(pGUID); }
	}
	editSavedQuery(pGUID)
	{
		let tmpView = this.pict.views.SavedQueriesList;
		if (tmpView && typeof tmpView._editQuery === 'function') { tmpView._editQuery(pGUID); }
	}
	deleteSavedQuery(pGUID)
	{
		let tmpView = this.pict.views.SavedQueriesList;
		if (tmpView && typeof tmpView._deleteQuery === 'function') { tmpView._deleteQuery(pGUID); }
	}

	// ── Helpers ─────────────────────────────────────────────────────────────
	_form(pViewName)
	{
		return this.pict.views[pViewName] || { _submit: () => {} };
	}
}

module.exports = DataBeaconApplication;
module.exports.default_configuration = {};
