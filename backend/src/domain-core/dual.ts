/**
 * Dual-number automatic differentiation.
 * A Dual value x = a + b·ε where ε² = 0. Function evaluation over Duals
 * simultaneously yields the function value (primal part) and its derivative
 * (dual part). Zero external dependencies — pure TypeScript.
 */
export class Dual {
  readonly real: number;
  readonly dual: number;

  constructor(real: number, dual = 0) {
    this.real = real;
    this.dual = dual;
  }

  static const(v: number): Dual {
    return new Dual(v, 0);
  }

  /** Variable seeded with derivative = 1 (independent variable). */
  static var(v: number): Dual {
    return new Dual(v, 1);
  }

  add(o: Dual | number): Dual {
    const r = toDual(o);
    return new Dual(this.real + r.real, this.dual + r.dual);
  }

  sub(o: Dual | number): Dual {
    const r = toDual(o);
    return new Dual(this.real - r.real, this.dual - r.dual);
  }

  mul(o: Dual | number): Dual {
    const r = toDual(o);
    return new Dual(
      this.real * r.real,
      this.real * r.dual + this.dual * r.real
    );
  }

  div(o: Dual | number): Dual {
    const r = toDual(o);
    if (r.real === 0) throw new Error('division by zero in Dual.div');
    return new Dual(
      this.real / r.real,
      (this.dual * r.real - this.real * r.dual) / (r.real * r.real)
    );
  }

  pow(o: number): Dual {
    const a = this.real;
    if (o === 0) return new Dual(1, 0);
    return new Dual(
      Math.pow(a, o),
      o * Math.pow(a, o - 1) * this.dual
    );
  }

  neg(): Dual {
    return new Dual(-this.real, -this.dual);
  }

  abs(): Dual {
    return this.real >= 0 ? this : this.neg();
  }

  toJSON(): string {
    return `${this.real} + ${this.dual}ε`;
  }
}

function toDual(o: Dual | number): Dual {
  return typeof o === 'number' ? Dual.const(o) : o;
}
