import { concatHex, Hex, hexToBigInt, keccak256, toHex } from 'viem';

export function prepareKeysetHash(keysetBytes: string): Hex {
  // prefix with 0x if not present
  const keysetBytesSanitized = keysetBytes.startsWith('0x')
    ? (keysetBytes as Hex)
    : (`0x${keysetBytes}` as Hex);

  // https://github.com/OffchainLabs/nitro-contracts/blob/v3.2.0/src/bridge/SequencerInbox.sol#L835-L836
  const keysetWord = hexToBigInt(keccak256(concatHex(['0xfe', keccak256(keysetBytesSanitized)])));
  const keysetHash = toHex(keysetWord ^ (1n << 255n), { size: 32 });

  return keysetHash;
}
