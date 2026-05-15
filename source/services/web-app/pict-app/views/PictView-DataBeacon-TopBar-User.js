/**
 * DataBeacon TopBar User View
 *
 * Renders into `#Theme-TopBar-User` — the right slot of Theme-TopBar.
 * Currently hosts a single gear button that toggles the Settings panel.
 * Add additional pinned actions here as the app grows.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'DataBeacon-TopBar-User',
	DefaultRenderable: 'DataBeacon-TopBar-User-Display',
	DefaultDestinationAddress: '#Theme-TopBar-User',
	AutoRender: false,

	CSS: /*css*/`
		.databeacon-user
		{
			display: flex;
			align-items: center;
			gap: 8px;
			height: 100%;
			padding: 0 12px;
		}
		.databeacon-user-btn
		{
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			padding: 0;
			border-radius: 6px;
			background: transparent;
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			color: var(--theme-color-text-on-brand, var(--theme-color-text-secondary, #B8AFA4));
			cursor: pointer;
			transition: background 0.12s, color 0.12s, border-color 0.12s;
		}
		.databeacon-user-btn:hover
		{
			background: var(--theme-color-background-hover, rgba(255,255,255,0.08));
			color:      var(--theme-color-text-on-brand,    var(--theme-color-text-primary, #FFFFFF));
		}
		.databeacon-user-btn svg { display: block; width: 18px; height: 18px; }
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-TopBar-User-Template',
			Template: /*html*/`
<div class="databeacon-user">
	<button class="databeacon-user-btn databeacon-user-btn-gear"
		onclick="_Pict.views.Layout.toggleSettingsPanel()"
		title="Settings" aria-label="Settings">
		<span data-databeacon-icon="settings" data-icon-size="18"></span>
	</button>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-TopBar-User-Display',
			TemplateHash: 'DataBeacon-TopBar-User-Template',
			ContentDestinationAddress: '#Theme-TopBar-User',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconTopBarUser extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();
		// Resolve any data-databeacon-icon placeholders into inline SVGs.
		let tmpIcons = this.pict.providers['DataBeacon-Icons'];
		if (tmpIcons && typeof tmpIcons.injectIconPlaceholders === 'function')
		{
			tmpIcons.injectIconPlaceholders('#Theme-TopBar-User');
		}
		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}
}

module.exports = PictViewDataBeaconTopBarUser;
module.exports.default_configuration = _ViewConfiguration;
