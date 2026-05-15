// Path-relative require lets the LogoGenerator stay out of the runtime bundle.
// pict-app/ → up 4 to package root (modules/apps/retold-databeacon/).
const tmpPackage = require('../../../../package.json');

if (!tmpPackage.retold || !tmpPackage.retold.brand)
{
	throw new Error('retold-databeacon: package.json is missing retold.brand — '
		+ 'run `npm run brand` (which calls pict-section-theme-brand) before building');
}

module.exports = tmpPackage.retold.brand;
