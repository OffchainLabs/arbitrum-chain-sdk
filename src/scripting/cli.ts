#!/usr/bin/env node

import { runCli } from './scriptUtils';
import { commands } from './commands';

runCli('chain-sdk', commands);
