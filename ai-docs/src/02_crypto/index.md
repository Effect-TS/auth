# Cryptography services

Select explicit backends for HMAC, authenticated encryption, signatures, and
password derivation. Effect's `Crypto` service supplies entropy and digests.
Keys and derived secrets stay redacted; applications own key rotation, nonces,
credential serialization, and password policy.
