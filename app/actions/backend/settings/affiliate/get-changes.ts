//File: app/actions/admin/settings/affiliate/get-changes.ts

import { Prisma } from "@prisma/client";

function isDeepEqual(val1: any, val2: any): boolean {
  if (val1 === val2) return true;

  if ((val1 === null || val1 === undefined) && (val2 === null || val2 === undefined)) return true;
  if (val1 === null || val1 === undefined || val2 === null || val2 === undefined) return false;

  if (val1 instanceof Date && val2 instanceof Date) {
    return val1.getTime() === val2.getTime();
  }

  if (val1 instanceof Date && typeof val2 === 'string') {
    return val1.toISOString() === new Date(val2).toISOString();
  }
  if (typeof val1 === 'string' && val2 instanceof Date) {
    return new Date(val1).toISOString() === val2.toISOString();
  }

  
  if (val1 instanceof Prisma.Decimal || val2 instanceof Prisma.Decimal) {
    return Number(val1) === Number(val2);
  }

  if (Array.isArray(val1) && Array.isArray(val2)) {
    if (val1.length !== val2.length) return false;
    // Deep compare each element
    for (let i = 0; i < val1.length; i++) {
      if (!isDeepEqual(val1[i], val2[i])) return false;
    }
    return true;
  }

  if (typeof val1 === 'object' && typeof val2 === 'object') {
    const keys1 = Object.keys(val1);
    const keys2 = Object.keys(val2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!isDeepEqual(val1[key], val2[key])) return false;
    }
    return true;
  }

  return false;
}

export function getChanges<T extends Record<string, any>>(oldData: T, newData: T) {
  const changes: Partial<T> = {};
  const oldValues: Partial<T> = {};

  Object.keys(newData).forEach((key) => {
    const k = key as keyof T;
    
    const originalValue = oldData?.[k];
    const newValue = newData[k];

    if (['createdAt', 'updatedAt', 'deletedAt', 'version'].includes(key)) return;

    if (!isDeepEqual(originalValue, newValue)) {
      changes[k] = newValue;
      oldValues[k] = originalValue;
    }
  });

  return { 
    hasChanges: Object.keys(changes).length > 0, 
    changes,    
    oldValues   
  };
}