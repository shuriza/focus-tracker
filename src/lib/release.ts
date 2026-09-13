/**
 * Single source of truth for the published extension package.
 * `extension/manifest.json` carries the same version; `npm run package:extension`
 * derives the ZIP name from the manifest, so both must be bumped together.
 */
export const EXTENSION_VERSION = "1.3.0";

export const EXTENSION_DOWNLOAD_PATH = `/downloads/fokus-kerja-v${EXTENSION_VERSION}.zip`;

export const EXTENSION_PACKAGE_FILENAME = `fokus-kerja-v${EXTENSION_VERSION}.zip`;
