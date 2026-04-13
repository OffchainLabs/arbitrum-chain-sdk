import { workflow } from '../scriptUtils';
import { schema as deployNewChainSchema, execute as deployNewChain } from './deployNewChain';
import {
  schema as createTokenBridgeAndWethGatewaySchema,
  execute as createTokenBridgeAndWethGateway,
} from './createTokenBridgeAndWethGateway';
import {
  schema as transferOwnershipSchema,
  execute as transferOwnership,
} from './transferOwnership';
import { schema as deployFullChainSchema, execute as deployFullChain } from './deployFullChain';

export const workflows = {
  deployNewChain: workflow(deployNewChainSchema, deployNewChain),
  createTokenBridgeAndWethGateway: workflow(
    createTokenBridgeAndWethGatewaySchema,
    createTokenBridgeAndWethGateway,
  ),
  transferOwnership: workflow(transferOwnershipSchema, transferOwnership),
  deployFullChain: workflow(deployFullChainSchema, deployFullChain),
};
