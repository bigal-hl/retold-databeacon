/**
 * Retold DataBeacon — Icon Provider
 *
 * Centralized SVG icon library. All icons share a 24x24 viewBox and use
 * currentColor for stroke so they inherit the surrounding text color via CSS.
 *
 * Each icon is registered as a pict template with hash `DataBeacon-Icon-{key}`,
 * so templates can emit `{~Template:DataBeacon-Icon-plus:~}` inline. Views can
 * also inject at custom sizes via `getIconSVGMarkup(key, size)` into
 * `<span data-databeacon-icon="key" data-icon-size="N"></span>` placeholders.
 */
const libPictProvider = require('pict-provider');

const _ProviderConfiguration =
{
	ProviderIdentifier: 'DataBeacon-Icons',
	AutoInitialize: true,
	AutoInitializeOrdinal: 0
};

// Default rendered size (pixels) when a placeholder does not specify one.
const _DefaultSize = 16;

// Icon library. The `{IconSize}` placeholder is replaced at render time.
const _DefaultIcons =
{
	// ── Navigation ─────────────────────────────────────────────────────────

	'dashboard': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="10" rx="1.5"/><rect x="13" y="3" width="8" height="6" rx="1.5"/><rect x="3" y="15" width="8" height="6" rx="1.5"/><rect x="13" y="11" width="8" height="10" rx="1.5"/></svg>',

	'connections': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/><path d="M4 10c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/><path d="M4 15c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/></svg>',

	'introspection': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/><path d="M8 11h6M11 8v6"/></svg>',

	'endpoints': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M7.2 10.8l9.6-3.6M7.2 13.2l9.6 3.6"/></svg>',

	'records': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14h18M9 4v16"/></svg>',

	'terminal': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>',

	'chevron-left': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',

	'chevron-right': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',

	'download': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',

	'save': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',

	'chevron-up': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>',

	'chevron-down': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',

	'tag': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',

	'settings': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',

	// ── Row / button actions ──────────────────────────────────────────────

	'plus': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',

	'trash': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/><path d="M10 11v6M14 11v6"/></svg>',

	'test': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',

	'connect': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 7l-1.5 1.5"/><path d="M14 10a5 5 0 0 1 0 7l-3 3a5 5 0 0 1-7-7l1.5-1.5"/></svg>',

	'disconnect': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7l3-3M4 20l3-3M15 5l-2 2M9 19l2-2"/><path d="M10 14a5 5 0 0 1 0-7l1.5-1.5"/><path d="M14 10a5 5 0 0 1 0 7l-1.5 1.5"/></svg>',

	'refresh': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',

	'eye': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>',

	'external-link': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></svg>',

	'play': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 4 20 12 6 20 6 4"/></svg>',

	'info': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',

	// ── Status / misc ─────────────────────────────────────────────────────

	'check': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',

	'x': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',

	'warning': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',

	'database': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="2.5"/><path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/><path d="M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/></svg>',

	'key': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L21 2M17 6l3 3M14 9l3 3"/></svg>',

	// ── Theme / mode switcher ─────────────────────────────────────────────

	'sun': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',

	'moon': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',

	'monitor': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',

	'palette': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 1 0 0 18c1.66 0 3-1.34 3-3v-.5a2.5 2.5 0 0 1 2.5-2.5H19a3 3 0 0 0 3-3 9 9 0 0 0-10-9z"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/><circle cx="10.5" cy="7" r="1" fill="currentColor"/><circle cx="14.5" cy="7" r="1" fill="currentColor"/><circle cx="17.5" cy="10.5" r="1" fill="currentColor"/></svg>',

	// ── Fallback ──────────────────────────────────────────────────────────

	'default': '<svg xmlns="http://www.w3.org/2000/svg" width="{IconSize}" height="{IconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="2"/></svg>'
};

class PictProviderDataBeaconIcons extends libPictProvider
{
	constructor(pFable, pOptions, pServiceHash)
	{
		let tmpOptions = Object.assign({}, _ProviderConfiguration, pOptions);
		super(pFable, tmpOptions, pServiceHash);

		this.serviceType = 'PictProviderDataBeaconIcons';

		// Deep copy the default icon set so consumer registrations do not mutate it.
		this._Icons = JSON.parse(JSON.stringify(_DefaultIcons));
	}

	onAfterInitialize()
	{
		this._registerIconTemplates();
		return super.onAfterInitialize();
	}

	/**
	 * Register each icon as a pict template so it can be emitted inline via
	 * `{~Template:DataBeacon-Icon-<key>:~}` from any other template.
	 * Templates are registered at the default size (16px).
	 */
	_registerIconTemplates()
	{
		if (!this.pict || !this.pict.TemplateProvider || typeof this.pict.TemplateProvider.addTemplate !== 'function')
		{
			this.log.warn('PictProviderDataBeaconIcons: TemplateProvider not available; icon templates not registered.');
			return;
		}

		let tmpKeys = Object.keys(this._Icons);
		for (let i = 0; i < tmpKeys.length; i++)
		{
			let tmpHash = `DataBeacon-Icon-${tmpKeys[i]}`;
			let tmpMarkup = this._Icons[tmpKeys[i]].replace(/\{IconSize\}/g, String(_DefaultSize));
			this.pict.TemplateProvider.addTemplate(tmpHash, tmpMarkup);
		}
	}

	/**
	 * Resolve an icon key to SVG markup at a specific pixel size.
	 * Unknown keys fall back to the `default` icon.
	 *
	 * @param {string} pIconKey
	 * @param {number} [pSize]
	 * @returns {string}
	 */
	getIconSVGMarkup(pIconKey, pSize)
	{
		let tmpSize = pSize || _DefaultSize;
		let tmpKey = pIconKey && this._Icons.hasOwnProperty(pIconKey) ? pIconKey : 'default';
		return this._Icons[tmpKey].replace(/\{IconSize\}/g, String(tmpSize));
	}

	/**
	 * Fill every `<span data-databeacon-icon="key" [data-icon-size="N"]>` placeholder
	 * within `pRootSelector` with the matching SVG. Called by views from onAfterRender
	 * so templates can stay declarative.
	 *
	 * @param {string} pRootSelector - CSS selector of the container to scan.
	 */
	injectIconPlaceholders(pRootSelector)
	{
		if (!this.pict || !this.pict.ContentAssignment) return;
		let tmpRootList = this.pict.ContentAssignment.getElement(pRootSelector);
		if (!tmpRootList || tmpRootList.length === 0) return;
		let tmpRoot = tmpRootList[0];
		let tmpPlaceholders = tmpRoot.querySelectorAll('[data-databeacon-icon]');
		for (let i = 0; i < tmpPlaceholders.length; i++)
		{
			let tmpEl = tmpPlaceholders[i];
			if (tmpEl.getAttribute('data-databeacon-icon-rendered') === 'true') continue;
			let tmpKey = tmpEl.getAttribute('data-databeacon-icon');
			let tmpSize = parseInt(tmpEl.getAttribute('data-icon-size'), 10) || _DefaultSize;
			tmpEl.innerHTML = this.getIconSVGMarkup(tmpKey, tmpSize);
			tmpEl.setAttribute('data-databeacon-icon-rendered', 'true');
		}
	}

	hasIcon(pIconKey)
	{
		return this._Icons.hasOwnProperty(pIconKey);
	}

	registerIcon(pIconKey, pSVGMarkup)
	{
		if (!pIconKey || !pSVGMarkup) return false;
		this._Icons[pIconKey] = pSVGMarkup;
		if (this.pict && this.pict.TemplateProvider)
		{
			this.pict.TemplateProvider.addTemplate(
				`DataBeacon-Icon-${pIconKey}`,
				pSVGMarkup.replace(/\{IconSize\}/g, String(_DefaultSize))
			);
		}
		return true;
	}
}

module.exports = PictProviderDataBeaconIcons;
module.exports.default_configuration = _ProviderConfiguration;
