/**
 * DataBeacon Layout View
 *
 * Owns the Pict-Section-Modal shell: a fixed Theme-TopBar at top, a
 * resizable Sidebar on the left, a gear-toggled overlay Settings panel
 * on the right, and a center workspace that hosts all six page panels.
 *
 * Page views render into `#DataBeacon-View-<Name>` panels inside the
 * center workspace; `setActiveView()` swaps which one is visible.
 */
const libPictView = require('pict-view');

const _NavItems =
[
	{ View: 'Dashboard',     Slug: 'dashboard',     Label: 'Dashboard',     Icon: 'dashboard' },
	{ View: 'Connections',   Slug: 'connections',   Label: 'Connections',   Icon: 'connections' },
	{ View: 'Introspection', Slug: 'introspection', Label: 'Introspection', Icon: 'introspection' },
	{ View: 'Endpoints',     Slug: 'endpoints',     Label: 'Endpoints',     Icon: 'endpoints' },
	{ View: 'Records',       Slug: 'records',       Label: 'Records',       Icon: 'records' },
	{ View: 'SQL',           Slug: 'sql',           Label: 'SQL',           Icon: 'terminal' }
];

const _ViewConfiguration =
{
	ViewIdentifier: 'Layout',
	DefaultRenderable: 'DataBeacon-Layout',
	DefaultDestinationAddress: '#DataBeacon-App',
	AutoRender: false,

	CSS: /*css*/`
		html, body { height: 100%; margin: 0; padding: 0; }
		body
		{
			background: var(--theme-color-background-primary, #ece9d8);
			color:      var(--theme-color-text-primary,       #1a1a1a);
			font-family: var(--theme-typography-family-sans,
				-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif);
		}
		#DataBeacon-App { height: 100%; min-height: 0; overflow: hidden; }
		.pict-modal-shell-host   { height: 100%; }
		.pict-modal-shell        { background: var(--theme-color-background-primary, #ece9d8); }
		.pict-modal-shell-panel  { background: var(--theme-color-background-panel,   var(--theme-color-background-secondary, #d8d3b8)); }
		.pict-modal-shell-center { background: var(--theme-color-background-primary, #ece9d8); }

		#DataBeacon-Workspace { height: 100%; min-height: 0; overflow: auto; padding: 24px; }
		.view-panel { max-width: 1200px; }
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-Layout-Shell',
			Template: /*html*/`<div id="DataBeacon-Layout-Mount" style="height:100%"></div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-Layout',
			TemplateHash: 'DataBeacon-Layout-Shell',
			ContentDestinationAddress: '#DataBeacon-App',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconLayout extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this._shellPanelsBuilt = false;
	}

	onBeforeRender(pRenderable)
	{
		// Publish the nav-item list so the Sidebar view can iterate over it.
		if (!this.pict.AppData.Layout) this.pict.AppData.Layout = {};
		this.pict.AppData.Layout.NavItems = _NavItems;
		return super.onBeforeRender(pRenderable);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();

		if (!this._shellPanelsBuilt)
		{
			this._buildShell();
			this._shellPanelsBuilt = true;
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	_buildShell()
	{
		let tmpModal = this.pict.views['Pict-Section-Modal'];
		let tmpMount = document.getElementById('DataBeacon-Layout-Mount');
		if (!tmpModal || !tmpMount) { return; }

		this._shell = tmpModal.shell(tmpMount, { PersistenceKey: 'retold-databeacon' });

		// Topbar — Theme-TopBar handles BrandMark + Nav slot + User slot.
		this._shell.addPanel(
		{
			Hash: 'topbar', Side: 'top', Mode: 'fixed', Size: 48,
			ContentDestinationId: 'Theme-TopBar', ContentView: 'Theme-TopBar'
		});

		// Left sidebar — host's navigation list.
		this._shell.addPanel(
		{
			Hash: 'sidebar', Side: 'left', Mode: 'resizable',
			Size: 220, MinSize: 180, MaxSize: 360, Title: 'Navigation',
			ContentDestinationId: 'DataBeacon-Sidebar-Host',
			ContentView: 'DataBeacon-Sidebar',
			ResponsiveDrawer: 900
		});

		// Hidden overlay settings panel — only the gear button opens it.
		this._shell.addPanel(
		{
			Hash: 'settings', Side: 'right', Mode: 'resizable',
			Position: 'overlay', Size: 360, MinSize: 280, MaxSize: 540,
			Hidden: true, Collapsed: true,
			ContentDestinationId: 'DataBeacon-Settings-Panel',
			ContentView: 'DataBeacon-SettingsPanel'
		});

		// Center — workspace for the six page views.
		this._shell.center({ ContentDestinationId: 'DataBeacon-Workspace' });

		// Mount the six page-panel destinations into the workspace.  Page
		// views render into these ids; setActiveView() toggles visibility.
		let tmpCenter = document.getElementById('DataBeacon-Workspace');
		if (tmpCenter)
		{
			tmpCenter.innerHTML = ''
				+ '<div id="DataBeacon-View-Dashboard"      class="view-panel"></div>'
				+ '<div id="DataBeacon-View-Connections"    class="view-panel" style="display:none;"></div>'
				+ '<div id="DataBeacon-View-Introspection"  class="view-panel" style="display:none;"></div>'
				+ '<div id="DataBeacon-View-Endpoints"      class="view-panel" style="display:none;"></div>'
				+ '<div id="DataBeacon-View-Records"        class="view-panel" style="display:none;"></div>'
				+ '<div id="DataBeacon-View-SQL"            class="view-panel" style="display:none;"></div>';
		}
	}

	getSidebarPanel()  { return this._shell ? this._shell.getPanel('sidebar')  : null; }
	getSettingsPanel() { return this._shell ? this._shell.getPanel('settings') : null; }

	toggleSidebar()       { let p = this.getSidebarPanel();  if (p && typeof p.toggle === 'function') p.toggle(); }
	toggleSettingsPanel() { let p = this.getSettingsPanel(); if (p && typeof p.toggle === 'function') p.toggle(); }

	/**
	 * Switch the visible page panel and nav highlight, then trigger
	 * the target view's render so it has fresh data on display.
	 * @param {string} pViewName
	 */
	setActiveView(pViewName)
	{
		this.pict.AppData.CurrentView = pViewName;

		// Toggle panel visibility.
		for (let i = 0; i < _NavItems.length; i++)
		{
			let tmpName = _NavItems[i].View;
			let tmpPanelList = this.pict.ContentAssignment.getElement(`#DataBeacon-View-${tmpName}`);
			if (tmpPanelList && tmpPanelList.length > 0)
			{
				tmpPanelList[0].style.display = (tmpName === pViewName) ? 'block' : 'none';
			}
		}

		// Re-render the sidebar so its active-state highlight follows the
		// new selection; it iterates over AppData.Layout.NavItems and reads
		// AppData.CurrentView to decide which item gets `.active`.
		let tmpSidebar = this.pict.views['DataBeacon-Sidebar'];
		if (tmpSidebar && typeof tmpSidebar.render === 'function') { tmpSidebar.render(); }

		// Render the active page view (container pages cascade to sub-views).
		let tmpView = this.pict.views[pViewName];
		if (tmpView && typeof tmpView.render === 'function')
		{
			tmpView.render();
		}
	}
}

module.exports = PictViewDataBeaconLayout;
module.exports.default_configuration = _ViewConfiguration;
