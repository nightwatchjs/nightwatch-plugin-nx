let nightwatchPackageJson;
let loadedNightwatch = false;

export function installedNightwatchVersion() {
  if (!loadedNightwatch) {
    try {
      nightwatchPackageJson = require('nightwatch/package.json');
    } catch { }
  }

  if (!nightwatchPackageJson) {
    return null;
  }
  const nightwatchPackageVersion = nightwatchPackageJson.version;
  const majorVersion = nightwatchPackageVersion.split('.')[0];
  if (!majorVersion) {
    return 0;
  }
  return +majorVersion;
}

/**
 * will not throw if nightwatch is not installed
 */
export function assertMinimumNightwatchVersion(minVersion: number) {
  const version = installedNightwatchVersion();
  if (version && version < minVersion) {
    throw new Error(
      `nightwatch version of ${minVersion} or higher is not installed. Expected nightwatch v${minVersion}+, found nightwatch v${version} instead.`
    );
  }
}
