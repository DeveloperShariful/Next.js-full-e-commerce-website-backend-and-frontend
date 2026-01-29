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

export function serializePrismaData(data: unknown): any {

  if (data === null || data === undefined) {
    return data;
  }

  if (isDecimal(data)) {
    return data.toNumber(); 
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  if (typeof data === "bigint") {
    return data.toString();
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializePrismaData(item));
  }

  if (typeof data === "object") {
    const newObj: Record<string, any> = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {

        const value = (data as Record<string, unknown>)[key];
        newObj[key] = serializePrismaData(value);
      }
    }
    return newObj;
  }
  return data;
}