import { names } from '@nrwl/devkit';

export function getUnscopedLibName(libRoot: string) {
  return libRoot.slice(libRoot.lastIndexOf('/') + 1);
}

export function getE2eProjectName(
  targetProjectName: string,
  targetLibRoot: string,
  nightwatchDirectory?: string
) {
  if (nightwatchDirectory) {
    return `${filePathPrefix(nightwatchDirectory)}-${getUnscopedLibName(
      targetLibRoot
    )}-e2e`;
  }
  return `${targetProjectName}-e2e`;
}

export function filePathPrefix(directory: string) {
  return `${names(directory).fileName}`.replace(new RegExp('/', 'g'), '-');
}
