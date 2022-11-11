import {
  ExecutorContext,
  logger,
  parseTargetString,
  readTargetOptions,
  runExecutor,
} from '@nrwl/devkit';
import 'dotenv/config';
import { basename, dirname, join } from 'path';
import { getTempTailwindPath } from '../../utils/ct-helpers';

const Nightwatch = require('nightwatch'); // @NOTE: Importing via ES6 messes the whole test dependencies.

export type Json = { [k: string]: any };

export interface NightwatchExecutorOptions extends Json {
  nightwatchConfig: string;
  watch?: boolean;
  tsConfig?: string;
  devServerTarget?: string;
  exit?: boolean;
  record?: boolean;
  parallel?: boolean;
  env?: Record<string, string>;
  spec?: string;
  copyFiles?: string;
  ciBuildId?: string | number;
  group?: string;
  ignoreTestFiles?: string;
  reporter?: string;
  reporterOptions?: string;
  skipServe?: boolean;
  tag?: string;
}

interface NormalizedNightwatchExecutorOptions extends NightwatchExecutorOptions {
  ctTailwindPath?: string;
}
export default async function nightwatchExecutor(
  options: NightwatchExecutorOptions,
  context: ExecutorContext
) {
  options = normalizeOptions(options, context);
  // this is used by nightwatch component testing presets to build the executor contexts with the correct configuration options.
  process.env.NX_NIGHTWATCH_TARGET_CONFIGURATION = context.configurationName;
  let success;

  try {
    success = await runNighwatch(null, options);
  } catch (e) {
    logger.error(e.message);
    success = false;
  }

  return { success };
}

function normalizeOptions(
  options: NightwatchExecutorOptions,
  context: ExecutorContext
): NormalizedNightwatchExecutorOptions {
  options.env = options.env || {};
  if (options.tsConfig) {
    const tsConfigPath = join(context.root, options.tsConfig);
    options.env.tsConfig = tsConfigPath;
    process.env.TS_NODE_PROJECT = tsConfigPath;
  }
  if (options.testingType === 'component') {
    const project = context?.projectGraph?.nodes?.[context.projectName];
    if (project?.data?.root) {
      options.ctTailwindPath = getTempTailwindPath(context);
    }
  }
  return options;
}

async function* startDevServer(
  opts: NightwatchExecutorOptions,
  context: ExecutorContext
) {
  // no dev server, return the provisioned base url
  if (!opts.devServerTarget || opts.skipServe) {
    yield opts.baseUrl;
    return;
  }

  const { project, target, configuration } = parseTargetString(
    opts.devServerTarget
  );
  const devServerTargetOpts = readTargetOptions(
    { project, target, configuration },
    context
  );
  const targetSupportsWatchOpt =
    Object.keys(devServerTargetOpts).includes('watch');

  for await (const output of await runExecutor<{
    success: boolean;
    baseUrl?: string;
  }>(
    { project, target, configuration },
    // @NOTE: Do not forward watch option if not supported by the target dev server,
    // this is relevant for running Nighwatch against dev server target that does not support this option,
    // for instance @nguniversal/builders:ssr-dev-server.
    targetSupportsWatchOpt ? { watch: opts.watch } : {},
    context
  )) {
    if (!output.success && !opts.watch)
      throw new Error('Could not compile application files');
    yield opts.baseUrl || (output.baseUrl as string);
  }
}

/**
 * @whatItDoes Initialize the nightwatch test runner with the provided project configuration.
 */
async function runNighwatch(
  baseUrl: string,
  opts: NormalizedNightwatchExecutorOptions
) {
  // nightwatch expects the folder where a nightwatch config is present
  const projectFolderPath = dirname(opts.nightwatchConfig);
  const options: any = {
    project: projectFolderPath,
    config: opts.nightwatchConfig,
  };
  // If not, will use the `baseUrl` normally from `nightwatch.conf.js`
  if (baseUrl) {
    options.baseUrl = { baseUrl };
  }
  if (opts.env) {
    options.env = opts.env;
  }
  if (opts.spec) {
    options.spec = opts.spec;
  }

  options.tag = opts.tag;

  options.record = opts.record;
  options.parallel = opts.parallel;
  options.group = opts.group;
  options.ignoreTestFiles = opts.ignoreTestFiles;

  if (opts.reporter) {
    options.reporter = opts.reporter;
  }

  if (opts.reporterOptions) {
    options.reporterOptions = opts.reporterOptions;
  }

  options.testingType = opts.testingType;

  const client = Nightwatch.createClient(options);
  let brwsr = null;
  client.launchBrowser().then(browser => {
    this.browser = browser;
    brwsr = browser;
  });

  return !brwsr.result.totalFailed && !brwsr.result.failures;
}
