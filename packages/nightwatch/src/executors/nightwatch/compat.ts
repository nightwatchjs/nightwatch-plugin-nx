import { convertNxExecutor } from '@nrwl/devkit';

import { default as nightwatchExecutor } from './nightwatch.impl';

export default convertNxExecutor(nightwatchExecutor);
