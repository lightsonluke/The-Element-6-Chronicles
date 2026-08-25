/**
 * Rollback snapshots must be plain, repeatable data. Canvas objects, functions,
 * DOM nodes, Audio objects, Maps, Sets and class instances do not belong here.
 */

function copyPlain(value, path = 'state', seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${path} contains a non-finite number.`);
    return Object.is(value, -0) ? 0 : value;
  }

  if (typeof value === 'undefined') return undefined;
  if (typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
    throw new Error(`${path} contains unsupported data (${typeof value}).`);
  }

  if (typeof value !== 'object') return value;
  if (seen.has(value)) throw new Error(`${path} contains a circular reference.`);
  seen.add(value);

  if (Array.isArray(value)) {
    const result = value.map((item, index) => {
      const copied = copyPlain(item, `${path}[${index}]`, seen);
      return copied === undefined ? null : copied;
    });
    seen.delete(value);
    return result;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${path} must be a plain object or array.`);
  }

  const result = {};
  for (const key of Object.keys(value).sort()) {
    const copied = copyPlain(value[key], `${path}.${key}`, seen);
    if (copied !== undefined) result[key] = copied;
  }
  seen.delete(value);
  return result;
}

export function cloneState(state) {
  return copyPlain(state);
}

export function serializeState(state) {
  return JSON.stringify(copyPlain(state));
}

export function deserializeState(serialized) {
  if (typeof serialized !== 'string') throw new Error('Serialized state must be a string.');
  return copyPlain(JSON.parse(serialized));
}

export function assertSerializableState(state) {
  copyPlain(state);
  return true;
}

export function byteLengthOfState(state) {
  const serialized = serializeState(state);
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(serialized).byteLength;
  return serialized.length;
}

