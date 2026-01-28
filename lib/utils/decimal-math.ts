//lib/utils/decimal-math.ts

import { Prisma } from "@prisma/client";

export class DecimalMath {
  static toDecimal(value: number | string | Prisma.Decimal | null | undefined): Prisma.Decimal {
    if (value === null || value === undefined) return new Prisma.Decimal(0);
    if (Prisma.Decimal.isDecimal(value)) return value;
    return new Prisma.Decimal(value);
  }

  static add(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): Prisma.Decimal {
    return this.toDecimal(a).add(this.toDecimal(b));
  }

  static sub(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): Prisma.Decimal {
    return this.toDecimal(a).sub(this.toDecimal(b));
  }

  static mul(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): Prisma.Decimal {
    return this.toDecimal(a).mul(this.toDecimal(b));
  }

  static div(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): Prisma.Decimal {
    const divisor = this.toDecimal(b);
    if (divisor.isZero()) return new Prisma.Decimal(0);
    return this.toDecimal(a).div(divisor);
  }

  static percent(amount: number | string | Prisma.Decimal, rate: number | string | Prisma.Decimal): Prisma.Decimal {
    return this.mul(amount, rate).div(100);
  }

  static toFixed(value: number | string | Prisma.Decimal, precision: number = 2): string {
    return this.toDecimal(value).toFixed(precision);
  }

  static toNumber(value: number | string | Prisma.Decimal): number {
    return this.toDecimal(value).toNumber();
  }

  static isZero(value: number | string | Prisma.Decimal): boolean {
    return this.toDecimal(value).isZero();
  }

  static gt(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): boolean {
    return this.toDecimal(a).greaterThan(this.toDecimal(b));
  }

  static gte(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): boolean {
    return this.toDecimal(a).greaterThanOrEqualTo(this.toDecimal(b));
  }

  static lt(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): boolean {
    return this.toDecimal(a).lessThan(this.toDecimal(b));
  }

  static lte(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): boolean {
    return this.toDecimal(a).lessThanOrEqualTo(this.toDecimal(b));
  }

  static max(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): Prisma.Decimal {
    const decA = this.toDecimal(a);
    const decB = this.toDecimal(b);
    return decA.greaterThan(decB) ? decA : decB;
  }

  static min(a: number | string | Prisma.Decimal, b: number | string | Prisma.Decimal): Prisma.Decimal {
    const decA = this.toDecimal(a);
    const decB = this.toDecimal(b);
    return decA.lessThan(decB) ? decA : decB;
  }

  static fromOrder(amount: number | string | Prisma.Decimal, tax: number | string | Prisma.Decimal, shipping: number | string | Prisma.Decimal, excludeTax: boolean, excludeShipping: boolean): Prisma.Decimal {
    let finalAmount = this.toDecimal(amount);
    if (excludeTax) finalAmount = finalAmount.sub(this.toDecimal(tax));
    if (excludeShipping) finalAmount = finalAmount.sub(this.toDecimal(shipping));
    return this.max(finalAmount, 0);
  }
}