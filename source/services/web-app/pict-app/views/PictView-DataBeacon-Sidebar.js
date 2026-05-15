/**
 * DataBeacon Sidebar View
 *
 * Renders into the left shell panel's ContentDestinationId
 * (`#DataBeacon-Sidebar-Host`). Owns the navigation list iterated from
 * `AppData.Layout.NavItems` and highlights the active item based on
 * `AppData.CurrentView`.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'DataBeacon-Sidebar',
	DefaultRenderable: 'DataBeacon-Sidebar-Display',
	DefaultDestinationAddress: '#DataBeacon-Sidebar-Host',
	AutoRender: false,

	CSS: /*css*/`
		.databeacon-sidebar
		{
			height: 100%;
			display: flex;
			flex-direction: column;
			background: var(--theme-color-background-panel, var(--theme-color-background-secondary, #d8d3b8));
			color:      var(--theme-color-text-primary,    #1a1a1a);
		}
		.databeacon-sidebar-nav
		{
			padding: 10px 0;
			overflow-y: auto;
			flex: 1 1 auto;
		}
		.databeacon-sidebar .nav-item
		{
			display: flex;
			align-items: center;
			gap: 10px;
			padding: 10px 20px;
			cursor: pointer;
			color: var(--theme-color-text-secondary, #4a4a4a);
			text-decoration: none;
			font-size: 13px;
			transition: background 0.12s, color 0.12s;
		}
		.databeacon-sidebar .nav-item:hover
		{
			background: var(--theme-color-background-hover, var(--theme-color-background-tertiary, #f0ede8));
			color:      var(--theme-color-text-primary,     #1a1a1a);
		}
		.databeacon-sidebar .nav-item.active
		{
			background: var(--theme-color-brand-primary,  #2E7D74);
			color:      var(--theme-color-text-on-brand,  #ffffff);
		}
		.databeacon-sidebar .nav-icon
		{
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 20px;
			height: 20px;
		}
		.databeacon-sidebar .nav-icon svg { display: block; }
		.databeacon-sidebar .nav-label { line-height: 1; }
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-Sidebar-Template',
			Template: /*html*/`
<div class="databeacon-sidebar">
	<nav class="databeacon-sidebar-nav">{~TS:DataBeacon-Sidebar-NavItem:AppData.Layout.NavItems~}</nav>
</div>`
		},
		{
			Hash: 'DataBeacon-Sidebar-NavItem',
			Template: /*html*/`
<a class="nav-item {~D:Record.ActiveClass~}" href="#/view/{~D:Record.Slug~}" data-view-nav="{~D:Record.View~}">
	<span class="nav-icon" data-databeacon-icon="{~D:Record.Icon~}" data-icon-size="20"></span>
	<span class="nav-label">{~D:Record.Label~}</span>
</a>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-Sidebar-Display',
			TemplateHash: 'DataBeacon-Sidebar-Template',
			ContentDestinationAddress: '#DataBeacon-Sidebar-Host',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconSidebar extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onBeforeRender(pRenderable)
	{
		// Decorate the nav list with an ActiveClass driven by AppData.CurrentView
		// so the template can render the highlight without per-render JS.
		let tmpCurrent = this.pict.AppData.CurrentView || 'Dashboard';
		let tmpItems = (this.pict.AppData.Layout && this.pict.AppData.Layout.NavItems) || [];
		for (let i = 0; i < tmpItems.length; i++)
		{
			tmpItems[i].ActiveClass = (tmpItems[i].View === tmpCurrent) ? 'active' : '';
		}
		return super.onBeforeRender(pRenderable);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		// Fill SVG icon placeholders the host's icon provider knows how to render.
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons && typeof tmpIcons.injectIconPlaceholders === 'function')
		{
			tmpIcons.injectIconPlaceholders('#DataBeacon-Sidebar-Host');
		}
		this.pict.CSSMap.injectCSS();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = PictViewDataBeaconSidebar;
module.exports.default_configuration = _ViewConfiguration;
