import * as path from 'path';
import { installedNightwatchVersion } from '../../utils/nightwatch-version';
import nightwatchExecutor, { NightwatchExecutorOptions } from './nightwatch.impl';

jest.mock('@nrwl/devkit');
let devkit = require('@nrwl/devkit');

jest.mock('../../utils/nightwatch-version');
jest.mock('../../utils/ct-helpers');
const Nightwatch = require('nightwatch');
jest.mock("nightwatch")

describe('nightwatch builder', () => {
  let nightwatchRun: jest.SpyInstance;
  let launchBrowser: jest.SpyInstance;
  const nightwatchOptions: NightwatchExecutorOptions = {
    nightwatchConfig: 'apps/my-app-e2e/nightwatch.conf.js',
    parallel: false,
    tsConfig: 'apps/my-app-e2e/tsconfig.json',
    devServerTarget: 'my-app:serve',
    exit: true,
    record: false,
    baseUrl: undefined,
    watch: false,
    skipServe: false,
  };
  let mockContext;
  let mockedInstalledNightwatchVersion: jest.Mock<
    ReturnType<typeof installedNightwatchVersion>
  > = installedNightwatchVersion as any;
  mockContext = { root: '/root', workspace: { projects: {} } } as any;
  (devkit as any).readTargetOptions = jest.fn().mockReturnValue({
    watch: true,
  });
  let runExecutor: any;

  beforeEach(async () => {
    runExecutor = (devkit as any).runExecutor = jest.fn().mockReturnValue([
      {
        success: true,
        baseUrl: 'http://localhost:4200',
      },
    ]);
    (devkit as any).stripIndents = (s) => s;
    (devkit as any).parseTargetString = (s) => {
      const [project, target, configuration] = s.split(':');
      return {
        project,
        target,
        configuration,
      };
    };
    nightwatchRun = jest
      .spyOn(Nightwatch, 'createClient')
      .mockReturnThis();

  });

  afterEach(() => jest.clearAllMocks());

  it('should call `nightwatch.createClient` if headless mode is `true`', async () => {
    const { success } = await nightwatchExecutor(nightwatchOptions, mockContext);
    expect(success).toEqual(true);

    expect(nightwatchRun).toHaveBeenCalledWith(
      expect.objectContaining({
        config: { baseUrl: 'http://localhost:4200' },
        project: path.dirname(nightwatchOptions.nightwatchConfig),
      })
    );
  });

  it('should fail early if application build fails', async () => {
    (devkit as any).runExecutor = jest.fn().mockReturnValue([
      {
        success: false,
      },
    ]);
    try {
      await nightwatchExecutor(nightwatchOptions, mockContext);
      fail('Should not execute');
    } catch (e) { }
  });


  it('should call `nightwatch.createClient` with provided baseUrl', async () => {
    const { success } = await nightwatchExecutor(
      {
        ...nightwatchOptions,
        devServerTarget: undefined,
        baseUrl: 'http://my-distant-host.com',
      },
      mockContext
    );
    expect(success).toEqual(true);
    expect(nightwatchRun).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {
          baseUrl: 'http://my-distant-host.com',
        },
        project: path.dirname(nightwatchOptions.nightwatchConfig),
      })
    );
  });



  it('should call `nightwatch.createClient` without baseUrl nor dev server target value', async () => {
    const { success } = await nightwatchExecutor(
      {
        nightwatchConfig: 'apps/my-app-e2e/nightwatch.conf.js',
        tsConfig: 'apps/my-app-e2e/tsconfig.json',
        devServerTarget: undefined,
        headless: true,
        exit: true,
        parallel: false,
        record: false,
        baseUrl: undefined,
        watch: false,
        skipServe: false,
      },
      mockContext
    );
    expect(success).toEqual(true);
    expect(nightwatchRun).toHaveBeenCalledWith(
      expect.objectContaining({
        project: path.dirname(nightwatchOptions.nightwatchConfig),
      })
    );
  });

  it('should call `nightwatch.createClient` with a string of files to ignore', async () => {
    const { success } = await nightwatchExecutor(
      {
        ...nightwatchOptions,
        ignoreTestFiles: '/some/path/to/a/file.js',
      },
      mockContext
    );
    expect(success).toEqual(true);
    expect(nightwatchRun).toHaveBeenCalledWith(
      expect.objectContaining({
        ignoreTestFiles: '/some/path/to/a/file.js',
      })
    );
  });

  it('should call `nightwatch.createClient` with a reporter and reporterOptions', async () => {
    const { success } = await nightwatchExecutor(
      {
        ...nightwatchOptions,
        reporter: 'junit',
        reporterOptions: 'mochaFile=reports/results-[hash].xml,toConsole=true',
      },
      mockContext
    );
    expect(success).toEqual(true);
    expect(nightwatchRun).toHaveBeenCalledWith(
      expect.objectContaining({
        reporter: 'junit',
        reporterOptions: 'mochaFile=reports/results-[hash].xml,toConsole=true',
      })
    );
  });

  it('should call `nightwatch.createClient` with provided nightwatchConfig as project and configFile', async () => {
    const { success } = await nightwatchExecutor(
      {
        ...nightwatchOptions,
        nightwatchConfig: 'some/project/my-nightwatch.json',
      },
      mockContext
    );
    expect(success).toEqual(true);
    expect(nightwatchRun).toHaveBeenCalledWith(
      expect.objectContaining({
        project: 'some/project',
        configFile: 'my-nightwatch.json',
      })
    );
  });

  it('when devServerTarget AND baseUrl options are both present, baseUrl should take precedence', async () => {
    const { success } = await nightwatchExecutor(
      {
        ...nightwatchOptions,
        baseUrl: 'test-url-from-options',
      },
      mockContext
    );
    expect(success).toEqual(true);
    expect(nightwatchRun).toHaveBeenLastCalledWith(
      expect.objectContaining({
        config: {
          baseUrl: 'test-url-from-options',
        },
      })
    );
  });

  it('when devServerTarget option present and baseUrl option is absent, baseUrl should come from devServerTarget', async () => {
    const { success } = await nightwatchExecutor(nightwatchOptions, mockContext);
    expect(success).toEqual(true);
    expect(nightwatchRun).toHaveBeenLastCalledWith(
      expect.objectContaining({
        config: {
          baseUrl: 'http://localhost:4200',
        },
      })
    );
  });

  it('should call `nightwatch.createClient` without serving the app', async () => {
    const { success } = await nightwatchExecutor(
      {
        ...nightwatchOptions,
        skipServe: true,
        baseUrl: 'http://my-distant-host.com',
      },
      mockContext
    );
    expect(success).toEqual(true);
    expect(runExecutor).not.toHaveBeenCalled();
    expect(nightwatchRun).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {
          baseUrl: 'http://my-distant-host.com',
        },
      })
    );
  });

  it('should not forward watch option to devServerTarget when not supported', async () => {
    // Simulate a dev server target that does not support watch option.
    (devkit as any).readTargetOptions = jest.fn().mockReturnValue({});

    const { success } = await nightwatchExecutor(nightwatchOptions, mockContext);

    expect(success).toEqual(true);
    expect((devkit as any).readTargetOptions.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        project: 'my-app',
        target: 'serve',
      })
    );
    expect(Object.keys(runExecutor.mock.calls[0][1])).not.toContain('watch');
  });

  it('should forward watch option to devServerTarget when supported', async () => {
    // Simulate a dev server target that support watch option.
    (devkit as any).readTargetOptions = jest
      .fn()
      .mockReturnValue({ watch: true });

    const { success } = await nightwatchExecutor(nightwatchOptions, mockContext);

    expect(success).toEqual(true);
    expect((devkit as any).readTargetOptions.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        project: 'my-app',
        target: 'serve',
      })
    );
    expect(Object.keys(runExecutor.mock.calls[0][1])).toContain('watch');
  });
});
