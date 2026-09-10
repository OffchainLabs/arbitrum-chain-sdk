export function getPrivateKeyParams(
  insecure: boolean,
  environment: NodeJS.ProcessEnv = process.env,
): {
  batchPosterPrivateKey?: string;
  validatorPrivateKey?: string;
} {
  if (!insecure) {
    return {};
  }

  const batchPosterPrivateKey = environment.BATCH_POSTER_PRIVATE_KEY;
  if (!batchPosterPrivateKey) {
    throw new Error(
      `Please provide the "BATCH_POSTER_PRIVATE_KEY" environment variable when using "--insecure"`,
    );
  }

  const validatorPrivateKey = environment.VALIDATOR_PRIVATE_KEY;
  if (!validatorPrivateKey) {
    throw new Error(
      `Please provide the "VALIDATOR_PRIVATE_KEY" environment variable when using "--insecure"`,
    );
  }

  return {
    batchPosterPrivateKey,
    validatorPrivateKey,
  };
}
