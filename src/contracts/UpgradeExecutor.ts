import { parseAbi } from 'viem';

export const upgradeExecutorABI = parseAbi([
  'function execute(address upgrade, bytes upgradeCallData) payable',
  'function executeCall(address target, bytes targetCallData) payable',
  'function hasRole(bytes32 role, address account) public view returns (bool)',
  'function grantRole(bytes32 role, address account)',
  'function revokeRole(bytes32 role, address account)',
]);
