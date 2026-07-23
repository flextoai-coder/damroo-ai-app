import * as ExpoCrypto from 'expo-crypto';

type CryptoLike = {
  getRandomValues?: <T extends ArrayBufferView>(array: T) => T;
  subtle?: {
    digest: (
      algorithm: AlgorithmIdentifier,
      data: BufferSource,
    ) => Promise<ArrayBuffer>;
  };
};

function resolveDigestAlgorithm(
  algorithm: AlgorithmIdentifier,
): ExpoCrypto.CryptoDigestAlgorithm {
  const name =
    typeof algorithm === 'string'
      ? algorithm
      : algorithm && typeof algorithm === 'object' && 'name' in algorithm
        ? String(algorithm.name)
        : 'SHA-256';

  switch (name.toUpperCase()) {
    case 'SHA-1':
      return ExpoCrypto.CryptoDigestAlgorithm.SHA1;
    case 'SHA-384':
      return ExpoCrypto.CryptoDigestAlgorithm.SHA384;
    case 'SHA-512':
      return ExpoCrypto.CryptoDigestAlgorithm.SHA512;
    case 'SHA-256':
    default:
      return ExpoCrypto.CryptoDigestAlgorithm.SHA256;
  }
}

/**
 * Hermes lacks WebCrypto (`crypto.subtle`). Supabase PKCE needs
 * `subtle.digest('SHA-256', …)` for S256 code challenges.
 */
function polyfillWebCrypto() {
  const g = globalThis as typeof globalThis & { crypto?: CryptoLike };
  const existing = g.crypto;

  if (
    typeof existing?.getRandomValues === 'function' &&
    typeof existing.subtle?.digest === 'function'
  ) {
    return;
  }

  const cryptoObj: CryptoLike = existing ?? {};

  if (typeof cryptoObj.getRandomValues !== 'function') {
    cryptoObj.getRandomValues = ExpoCrypto.getRandomValues as NonNullable<
      CryptoLike['getRandomValues']
    >;
  }

  if (typeof cryptoObj.subtle?.digest !== 'function') {
    cryptoObj.subtle = {
      digest(algorithm, data) {
        return ExpoCrypto.digest(resolveDigestAlgorithm(algorithm), data);
      },
    };
  }

  // Partial WebCrypto surface is enough for Supabase PKCE (S256).
  (g as { crypto: CryptoLike }).crypto = cryptoObj;
}

polyfillWebCrypto();
