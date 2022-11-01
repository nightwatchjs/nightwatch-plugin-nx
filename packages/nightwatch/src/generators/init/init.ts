import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  readWorkspaceConfiguration,
  removeDependenciesFromPackageJson,
  Tree,
  updateWorkspaceConfiguration,
} from '@nrwl/devkit';
import {
  nightwatchVersion,
  nxVersion,
  typesNodeVersion,
} from '../../utils/versions';
import { Schema } from './schema';

function setupE2ETargetDefaults(tree: Tree) {
  const workspaceConfiguration = readWorkspaceConfiguration(tree);

  if (!workspaceConfiguration.namedInputs) {
    return;
  }

  // E2e targets depend on all their project's sources + production sources of dependencies
  workspaceConfiguration.targetDefaults ??= {};

  const productionFileSet = !!workspaceConfiguration.namedInputs?.production;
  workspaceConfiguration.targetDefaults.e2e ??= {};
  workspaceConfiguration.targetDefaults.e2e.inputs ??= [
    'default',
    productionFileSet ? '^production' : '^default',
  ];

  updateWorkspaceConfiguration(tree, workspaceConfiguration);
}

function updateDependencies(tree: Tree) {
  removeDependenciesFromPackageJson(tree, ['@nrwl/nightwatch'], []);

  return addDependenciesToPackageJson(
    tree,
    {},
    {
      nightwatch: nightwatchVersion,
      '@types/node': typesNodeVersion,
    }
  );
}

export function nightwatchInitGenerator(tree: Tree, options: Schema) {
  setupE2ETargetDefaults(tree);
  return !options.skipPackageJson ? updateDependencies(tree) : () => { };
}

export default nightwatchInitGenerator;
export const nightwatchInitSchematic = convertNxGenerator(nightwatchInitGenerator);
