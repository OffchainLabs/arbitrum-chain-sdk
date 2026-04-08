# Deploy chain
npx tsx src/scripting/examples/deployNewChain.ts "$(jq -c '.createRollup' deployChainParams.json)"

# Deploy token bridge
npx tsx src/scripting/examples/createTokenBridge.ts "$(jq -c '.createTokenBridge' deployChainParams.json)"

# Transfer ownership
npx tsx src/scripting/examples/transferOwnership.ts "$(jq -c '.transferOwnership' deployChainParams.json)"