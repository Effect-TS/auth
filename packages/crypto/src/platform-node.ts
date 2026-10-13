/**
 * Node.js native cryptography backend with shared key-derivation admission.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Node from "./internal/node.ts"

/**
 * Cryptography for Node.js. Requires a shared KdfAdmission Layer.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layer = Node.layer
