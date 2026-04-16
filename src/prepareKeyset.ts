function uint64ToBigEndian(value: number): Uint8Array {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(0, Math.floor(value / 0x100000000));
  view.setUint32(4, value % 0x100000000);
  return new Uint8Array(buffer);
}
function byteToHex(byte: number): string {
  return byte.toString(16).padStart(2, '0');
}

function uint16ToBigEndian(value: number): Uint8Array {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setUint16(0, value);
  return new Uint8Array(buffer);
}

export function prepareKeyset(publicKeys: string[], assumedHonest: number): `0x${string}` {
  const numberOfMembers = publicKeys.length;
  const membersBuffer: Uint8Array[] = [];

  // Encode assumed-honest and number of committee members
  membersBuffer.push(uint64ToBigEndian(assumedHonest));
  membersBuffer.push(uint64ToBigEndian(numberOfMembers));

  for (const key of publicKeys) {
    // Decode the base64 public key to get its hexadecimal representation
    const keyHex = Buffer.from(key, 'base64').toString('hex');

    // Calculate the length of the public key in bytes (half the number of characters of its hexadecimal representation)
    const keyLength = keyHex.length / 2;

    // Encode the length as uint16 in big endian
    membersBuffer.push(uint16ToBigEndian(keyLength));

    // Convert the hexadecimal public key to a byte array and add it to the buffer
    const keyBytes = Uint8Array.from(Buffer.from(keyHex, 'hex'));
    membersBuffer.push(keyBytes);
  }

  // Concatenate all Uint8Array elements into a single Uint8Array
  const totalLength = membersBuffer.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const arr of membersBuffer) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return `0x${Array.from(result).map(byteToHex).join('')}`;
}
