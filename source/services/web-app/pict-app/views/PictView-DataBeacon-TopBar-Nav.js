/**
 * DataBeacon TopBar Nav View
 *
 * Renders into `#Theme-TopBar-Nav` — the left slot of Theme-TopBar,
 * right of the BrandMark. Shows the current section name + the beacon
 * name as context ("where am I in the app").
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'DataBeacon-TopBar-Nav',
	DefaultRenderable: 'DataBeacon-TopBar-Nav-Display',
	DefaultDestinationAddress: '#Theme-TopBar-Nav',
	AutoRender: false,

	CSS: /*css*/`
		.databeacon-nav
		{
			display: flex;
			align-items: baseline;
			gap: 10px;
			height: 100%;
			padding: 0 12px;
			color: var(--theme-color-text-on-brand, var(--theme-color-text-primary, #E8E0D4));
			line-height: 48px;
		}
		.databeacon-nav-section
		{
			font-weight: 600;
			font-size: 14px;
		}
		.databeacon-nav-beacon
		{
			font-size: 12px;
			opacity: 0.75;
		}
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-TopBar-Nav-Template',
			Template: /*html*/`
<div class="databeacon-nav">
	<span class="databeacon-nav-section">{~D:AppData.DataBeacon.PageTitle~}</span>
	<span class="databeacon-nav-beacon">{~D:AppData.Dashboard.BeaconNameDisplay~}</span>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-TopBar-Nav-Display',
			TemplateHash: 'DataBeacon-TopBar-Nav-Template',
			ContentDestinationAddress: '#Theme-TopBar-Nav',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconTopBarNav extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = PictViewDataBeaconTopBarNav;
module.exports.default_configuration = _ViewConfiguration;
