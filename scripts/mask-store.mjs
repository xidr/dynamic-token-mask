import {MASK_SHAPES} from "./mask-geometry.mjs";

export const MODULE_ID = "dynamic-token-mask";
export const SETTING_KEY = "masks";
export const CHANGE_HOOK = `${MODULE_ID}.masksChanged`;

export class MaskConflictError extends Error {}

function validateSource(src) {
  if (typeof src !== "string" || !src.trim() || src.includes("*")) {
    throw new TypeError("A concrete image path is required, not a wildcard pattern.");
  }
  return src;
}

/** Radius is relative to the shorter image dimension; centers use their respective axes. */
export function validateMask(input) {
  if (!input || typeof input !== "object") throw new TypeError("A mask record is required.");
  const {src, centerX, centerY, radius, imageWidth, imageHeight} = input;
  validateSource(src);
  if (Object.hasOwn(input, "shape") && !MASK_SHAPES.includes(input.shape)) {
    throw new TypeError("Unsupported mask shape.");
  }
  for (const value of [centerX, centerY, radius, imageWidth, imageHeight]) {
    if (!Number.isFinite(value)) throw new TypeError("Mask coordinates and dimensions must be finite numbers.");
  }
  if (!Number.isSafeInteger(imageWidth) || !Number.isSafeInteger(imageHeight)
    || imageWidth <= 0 || imageHeight <= 0 || radius <= 0) {
    throw new RangeError("Image dimensions must be positive integers and radius must be positive.");
  }
  const r = radius * Math.min(imageWidth, imageHeight);
  const x = centerX * imageWidth;
  const y = centerY * imageHeight;
  const tolerance = Math.max(imageWidth, imageHeight) * 1e-12;
  if (centerX < 0 || centerX > 1 || centerY < 0 || centerY > 1
    || r > Math.min(x, imageWidth - x, y, imageHeight - y) + tolerance) {
    throw new RangeError("The mask frame must fit inside the source image.");
  }
  // Circles keep their legacy API representation so schema upgrades preserve snapshots and cache keys.
  const record = {src, centerX, centerY, radius, imageWidth, imageHeight};
  if (Object.hasOwn(input, "shape") && input.shape !== "circle") record.shape = input.shape;
  return record;
}

function readCollection(value) {
  if (![1, 2].includes(value?.version) || !Array.isArray(value.masks)) {
    throw new Error("Unsupported or invalid mask storage format; refusing to overwrite it.");
  }
  const records = new Map();
  for (const input of value.masks) {
    const mask = validateMask(input);
    if ((value.version === 1 && mask.shape) || (value.version === 2 && !Object.hasOwn(input, "shape"))) {
      throw new Error("Mask shape does not match the storage version.");
    }
    if (records.has(mask.src)) throw new Error("Duplicate image path in mask storage.");
    records.set(mask.src, mask);
  }
  return {records, version: value.version};
}

/** Foundry adapter dependencies are injected so persistence behavior can be tested without a world. */
export class MaskStore {
  #settings;
  #canWrite;
  #notify;
  #previous = new Map();
  #queue = Promise.resolve();

  constructor({settings, canWrite, notify}) {
    this.#settings = settings;
    this.#canWrite = canWrite;
    this.#notify = notify;
  }

  register() {
    this.#settings.register(MODULE_ID, SETTING_KEY, {
      scope: "world",
      config: false,
      restricted: true,
      type: Object,
      default: {version: 1, masks: []},
      onChange: value => this.#onChange(value)
    });
  }

  /** Call at ready: establish a baseline after world settings have loaded. */
  initialize() {
    this.#previous = this.#read().records;
  }

  #read() {
    return readCollection(this.#settings.get(MODULE_ID, SETTING_KEY));
  }

  get(src) {
    validateSource(src);
    return this.#read().records.get(src) ?? null;
  }

  has(src) {
    return this.get(src) !== null;
  }

  list() {
    return [...this.#read().records.values()];
  }

  save(input, {expected} = {}) {
    // Copy and validate before queuing: caller mutations cannot change a pending save.
    const mask = validateMask(input);
    return this.#write(mask.src, expected, async ({records, version}) => {
      if (JSON.stringify(records.get(mask.src)) === JSON.stringify(mask)) return {...mask};
      records.set(mask.src, mask);
      await this.#persist(records, mask.shape ? 2 : version);
      return {...mask};
    });
  }

  remove(src, {expected} = {}) {
    validateSource(src);
    return this.#write(src, expected, async ({records, version}) => {
      if (!records.delete(src)) return false;
      await this.#persist(records, version);
      return true;
    });
  }

  #write(src, expected, operation) {
    // An omitted expectation permits any state. Null expects no saved mask.
    const expectedMask = expected == null ? expected : validateMask(expected);
    const result = this.#queue.then(() => {
      if (!this.#canWrite()) throw new Error("Only a GM in a ready world can change masks.");
      const collection = this.#read();
      if (expectedMask !== undefined
        && JSON.stringify(collection.records.get(src) ?? null) !== JSON.stringify(expectedMask)) {
        throw new MaskConflictError("The saved mask changed after it was loaded.");
      }
      return operation(collection);
    });
    // Serialize this client's writes without poisoning the queue after a failed save.
    this.#queue = result.catch(() => {});
    return result;
  }

  #persist(records, version) {
    const masks = [...records.values()];
    const value = version === 1 ? masks : masks.map(mask => ({...mask, shape: mask.shape ?? "circle"}));
    return this.#settings.set(MODULE_ID, SETTING_KEY, {version, masks: value});
  }

  #onChange(value) {
    const {records: next} = readCollection(value);
    const paths = [...new Set([...this.#previous.keys(), ...next.keys()])].filter(src =>
      JSON.stringify(this.#previous.get(src)) !== JSON.stringify(next.get(src)));
    this.#previous = next;
    if (paths.length) this.#notify(Object.freeze(paths));
  }
}
