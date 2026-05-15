/**
 * DataBeacon Settings Panel View
 *
 * Hidden right-side overlay panel toggled by the gear button in the
 * TopBar-User slot. Embeds pict-section-theme's Picker / ModeToggle /
 * ScaleSelect controls via `Theme-Section.mount()`, plus a Default Page
 * Size preference that the Records view honors.
 */
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'DataBeacon-SettingsPanel',
	DefaultRenderable: 'DataBeacon-SettingsPanel-Display',
	DefaultDestinationAddress: '#DataBeacon-Settings-Panel',
	AutoRender: false,

	CSS: /*css*/`
		.databeacon-settings-body
		{
			padding: 16px;
			color: var(--theme-color-text-primary, #1a1a1a);
			background: var(--theme-color-background-panel, var(--theme-color-background-secondary, #FAF8F4));
			height: 100%;
			box-sizing: border-box;
			overflow-y: auto;
		}
		.databeacon-settings-section
		{
			margin-bottom: 18px;
		}
		.databeacon-settings-divider
		{
			height: 1px;
			background: var(--theme-color-border-default, #DDD6CA);
			margin: 8px 0 16px 0;
		}
		.databeacon-settings-label
		{
			font-size: 11px;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: var(--theme-color-text-muted, #8A7F72);
			margin-bottom: 8px;
			font-weight: 600;
		}
		.databeacon-settings-row
		{
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 10px;
			padding: 6px 0;
			font-size: 13px;
		}
		.databeacon-settings-row select
		{
			padding: 6px 10px;
			border-radius: 4px;
			border: 1px solid var(--theme-color-border-default, #DDD6CA);
			background: var(--theme-color-background-input, #FFFFFF);
			color:      var(--theme-color-text-primary,      #1a1a1a);
			font-size: 13px;
		}
	`,

	Templates:
	[
		{
			Hash: 'DataBeacon-SettingsPanel-Template',
			Template: /*html*/`
<div class="databeacon-settings-body">
	<div class="databeacon-settings-section">
		<div class="databeacon-settings-label">Appearance</div>
		<div id="DataBeacon-Settings-Theme"></div>
	</div>
	<div class="databeacon-settings-divider"></div>
	<div class="databeacon-settings-section">
		<div class="databeacon-settings-label">Records</div>
		<div class="databeacon-settings-row">
			<label for="DataBeacon-Setting-PageSize">Default page size</label>
			<select id="DataBeacon-Setting-PageSize"
				onchange="_Pict.views['DataBeacon-SettingsPanel'].onPageSizeChanged(this.value)">
				<option value="25">25</option>
				<option value="50">50</option>
				<option value="100">100</option>
				<option value="250">250</option>
			</select>
		</div>
	</div>
</div>`
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'DataBeacon-SettingsPanel-Display',
			TemplateHash: 'DataBeacon-SettingsPanel-Template',
			ContentDestinationAddress: '#DataBeacon-Settings-Panel',
			RenderMethod: 'replace'
		}
	]
};

class PictViewDataBeaconSettingsPanel extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent)
	{
		this.pict.CSSMap.injectCSS();

		// Mount the theme controls on every render — the template re-renders
		// rewrite the inner DataBeacon-Settings-Theme div and erase the
		// previously-rendered Picker/ModeToggle/ScaleSelect views.
		let tmpThemeProvider = this.pict.providers && this.pict.providers['Theme-Section'];
		if (tmpThemeProvider && typeof tmpThemeProvider.mount === 'function')
		{
			tmpThemeProvider.mount(
			{
				Container: '#DataBeacon-Settings-Theme',
				Views: ['Picker', 'ModeToggle', 'ScaleSelect']
			});
		}

		// Sync the page-size select to the current AppData value.
		let tmpBrowser = (this.pict.AppData && this.pict.AppData.RecordBrowser) || {};
		let tmpSize = tmpBrowser.PageSize || 50;
		let tmpSelectList = this.pict.ContentAssignment.getElement('#DataBeacon-Setting-PageSize');
		if (tmpSelectList && tmpSelectList.length > 0)
		{
			tmpSelectList[0].value = String(tmpSize);
		}

		return super.onAfterRender(pRenderable, pRenderDestinationAddress, pRecord, pContent);
	}

	onPageSizeChanged(pSize)
	{
		let tmpSize = parseInt(pSize, 10);
		if (!Number.isFinite(tmpSize) || tmpSize <= 0) { return; }
		if (!this.pict.AppData.RecordBrowser) { this.pict.AppData.RecordBrowser = {}; }
		this.pict.AppData.RecordBrowser.PageSize = tmpSize;
		let tmpBrowserView = this.pict.views.RecordBrowser;
		if (tmpBrowserView && typeof tmpBrowserView._setPageSize === 'function')
		{
			tmpBrowserView._setPageSize(tmpSize);
		}
	}
}

module.exports = PictViewDataBeaconSettingsPanel;
module.exports.default_configuration = _ViewConfiguration;
