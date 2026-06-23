// lib/format-data.ts

interface DecimalLike {
  toNumber: () => number;
  toString: () => string;
}

function isDecimal(value: unknown): value is DecimalLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as Record<string, unknown>).toNumber === "function"
  );
}

export function serializePrismaData<T>(data: T): T {
  if (data === null || data === undefined) return data;

  if (isDecimal(data)) return data.toNumber() as unknown as T;

  if (data instanceof Date) return data.toISOString() as unknown as T;

  if (typeof data === "bigint") return data.toString() as unknown as T;

  if (Array.isArray(data)) {
    return data.map((item) => serializePrismaData(item)) as unknown as T;
  }

  if (typeof data === "object") {
    const newObj: Record<string, unknown> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newObj[key] = serializePrismaData((data as Record<string, unknown>)[key]);
      }
    }
    return newObj as unknown as T;
  }

  return data;
}