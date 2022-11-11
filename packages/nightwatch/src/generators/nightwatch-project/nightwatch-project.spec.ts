import {
  addProjectConfiguration,
  readJson,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
  WorkspaceJsonConfiguration,
} from '@nrwl/devkit';
import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing';
import { nightwatchProjectGenerator } from './nightwatch-project';
import { Schema } from './schema';
import { Linter } from '@nrwl/linter';
import { installedNightwatchVersion } from '../../utils/nightwatch-version';

jest.mock('../../utils/nightwatch-version');

describe('nightwatch Project', () => {
  let tree: Tree;
  const defaultOptions: Omit<Schema, 'name' | 'project'> = {
    linter: Linter.EsLint,
    standaloneConfig: false,
  };
  let mockedInstalledNightwatchVersion: jest.Mock<
    ReturnType<typeof installedNightwatchVersion>
  > = installedNightwatchVersion as never;

  beforeEach(() => {
    tree = createTreeWithEmptyV1Workspace();

    addProjectConfiguration(tree, 'my-app', {
      root: 'my-app',
      targets: {
        serve: {
          executor: 'serve-executor',
          options: {},
          configurations: {
            production: {},
          },
        },
      },
    });

    addProjectConfiguration(tree, 'my-dir-my-app', {
      root: 'my-dir/my-app',
      targets: {
        serve: {
          executor: 'serve-executor',
          options: {},
          configurations: {
            production: {},
          },
        },
      },
    });
  });
  afterEach(() => jest.clearAllMocks());

  describe('> v2', () => {
    beforeEach(() => {
      mockedInstalledNightwatchVersion.mockReturnValue(10);
    });

    it('should generate files for v10 and above', async () => {
      await nightwatchProjectGenerator(tree, {
        ...defaultOptions,
        name: 'my-app-e2e',
        project: 'my-app',
      });

      expect(tree.exists('apps/my-app-e2e/nightwatch.conf.ts')).toBeTruthy();

      expect(tree.exists('apps/my-app-e2e/src/test/login.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app-e2e/src/test/titleAssertion.ts')).toBeTruthy();
      expect(tree.exists('apps/my-app-e2e/src/support/app.po.ts')).toBeTruthy();
    });

    it('should not add lint target when "none" is passed', async () => {
      await nightwatchProjectGenerator(tree, {
        name: 'my-app-e2e',
        project: 'my-app',
        linter: Linter.None,
        standaloneConfig: false,
      });
      const workspaceJson = readJson(tree, 'workspace.json');
      const project = workspaceJson.projects['my-app-e2e'];

      expect(project.architect.lint).toBeUndefined();
    });

    it('should update tags and implicit dependencies', async () => {
      await nightwatchProjectGenerator(tree, {
        name: 'my-app-e2e',
        project: 'my-app',
        linter: Linter.EsLint,
        standaloneConfig: false,
      });

      const project = readProjectConfiguration(tree, 'my-app-e2e');
      expect(project.tags).toEqual([]);
      expect(project.implicitDependencies).toEqual(['my-app']);
    });

    it('should set right path names in `nightwatch.config.ts`', async () => {
      await nightwatchProjectGenerator(tree, {
        ...defaultOptions,
        name: 'my-app-e2e',
        project: 'my-app',
      });
      const nightwatchConfig = tree.read(
        'apps/my-app-e2e/nightwatch.config.ts',
        'utf-8'
      );
      expect(nightwatchConfig).toMatchSnapshot();
    });

    it('should set right path names in `tsconfig.e2e.json`', async () => {
      await nightwatchProjectGenerator(tree, {
        ...defaultOptions,
        name: 'my-app-e2e',
        project: 'my-app',
      });
      const tsconfigJson = readJson(tree, 'apps/my-app-e2e/tsconfig.json');
      expect(tsconfigJson).toMatchSnapshot();
    });

    it('should extend from tsconfig.base.json', async () => {
      await nightwatchProjectGenerator(tree, {
        ...defaultOptions,
        name: 'my-app-e2e',
        project: 'my-app',
      });

      const tsConfig = readJson(tree, 'apps/my-app-e2e/tsconfig.json');
      expect(tsConfig.extends).toBe('../../tsconfig.base.json');
    });

    it('should support a root tsconfig.json instead of tsconfig.base.json', async () => {
      tree.rename('tsconfig.base.json', 'tsconfig.json');

      await nightwatchProjectGenerator(tree, {
        ...defaultOptions,
        name: 'my-app-e2e',
        project: 'my-app',
      });

      const tsConfig = readJson(tree, 'apps/my-app-e2e/tsconfig.json');
      expect(tsConfig.extends).toBe('../../tsconfig.json');
    });

    describe('nested', () => {
      it('should set right path names in `nightwatch.config.ts`', async () => {
        await nightwatchProjectGenerator(tree, {
          ...defaultOptions,
          name: 'my-app-e2e',
          project: 'my-dir-my-app',
          directory: 'my-dir',
        });

        const nightwatchConfig = tree.read(
          'apps/my-dir/my-app-e2e/nightwatch.conf.ts',
          'utf-8'
        );
        expect(nightwatchConfig).toMatchSnapshot();
      });

      it('should set right path names in `tsconfig.e2e.json`', async () => {
        await nightwatchProjectGenerator(tree, {
          ...defaultOptions,
          name: 'my-app-e2e',
          project: 'my-dir-my-app',
          directory: 'my-dir',
        });
        const tsconfigJson = readJson(
          tree,
          'apps/my-dir/my-app-e2e/tsconfig.json'
        );

        expect(tsconfigJson).toMatchSnapshot();
      });

      it('should extend from tsconfig.base.json', async () => {
        await nightwatchProjectGenerator(tree, {
          ...defaultOptions,
          name: 'my-app-e2e',
          project: 'my-app',
          directory: 'my-dir',
        });

        const tsConfig = readJson(tree, 'apps/my-dir/my-app-e2e/tsconfig.json');
        expect(tsConfig.extends).toBe('../../../tsconfig.base.json');
      });

      it('should support a root tsconfig.json instead of tsconfig.base.json', async () => {
        tree.rename('tsconfig.base.json', 'tsconfig.json');

        await nightwatchProjectGenerator(tree, {
          ...defaultOptions,
          name: 'my-app-e2e',
          project: 'my-app',
          directory: 'my-dir',
        });

        const tsConfig = readJson(tree, 'apps/my-dir/my-app-e2e/tsconfig.json');
        expect(tsConfig.extends).toBe('../../../tsconfig.json');
      });
    });

    describe('--project', () => {
      describe('none', () => {
        it('should not add any implicit dependencies', async () => {
          await nightwatchProjectGenerator(tree, {
            ...defaultOptions,
            name: 'my-app-e2e',
            baseUrl: 'http://localhost:7788',
          });

          const workspaceJson = readJson<WorkspaceJsonConfiguration>(
            tree,
            'workspace.json'
          );
          const projectConfig = workspaceJson.projects['my-app-e2e'];
          expect(projectConfig.implicitDependencies).not.toBeDefined();
          expect(projectConfig.tags).toEqual([]);
        });
      });

      it('should not throw an error when --project does not have targets', async () => {
        const projectConf = readProjectConfiguration(tree, 'my-app');
        delete projectConf.targets;

        updateProjectConfiguration(tree, 'my-app', projectConf);
        await nightwatchProjectGenerator(tree, {
          name: 'my-app-e2e',
          project: 'my-app',
          linter: Linter.EsLint,
        });

        const projectConfig = readProjectConfiguration(tree, 'my-app-e2e');
        expect(projectConfig.targets['e2e'].options.devServerTarget).toEqual(
          'my-app:serve'
        );
      });
    });

    it('should generate in the correct folder', async () => {
      await nightwatchProjectGenerator(tree, {
        ...defaultOptions,
        name: 'other-e2e',
        project: 'my-app',
        directory: 'one/two',
      });
      const workspace = readJson(tree, 'workspace.json');
      expect(workspace.projects['one-two-other-e2e']).toBeDefined();
      [
        'apps/one/two/other-e2e/nightwatch.conf.ts',
        'apps/one/two/other-e2e/src/test/login.ts',
      ].forEach((path) => expect(tree.exists(path)).toBeTruthy());
    });
  });
});
