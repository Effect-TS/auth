/**
 * Bun native cryptography backend through Node-compatible platform APIs.
 *
 * @stability unstable
 * @since 0.1.0
 */
import * as Node from "./internal/node.ts"

/**
 * Cryptography for Bun through its Node-compatible native APIs.
 *
 * @stability unstable
 * @category layers
 * @since 0.1.0
 */
export const layer = Node.layer
