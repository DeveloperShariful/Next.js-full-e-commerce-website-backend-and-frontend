//app/actions/admin/product/product-utilis.ts 

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseJSON<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return fallback;
  }
}

export function cleanPrice(price: string | number | null): number {
  if (!price) return 0;
  const p = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(p) ? 0 : p;
}