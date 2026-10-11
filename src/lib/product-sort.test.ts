import { describe, expect, it } from 'vitest';

import { makeProduct } from '../test-fixtures.ts';
import { sortByName, sortByPrice, sortProducts } from './ordering.ts';

const mid = makeProduct({ id: 2, name: 'Aceite de oliva', unitPrice: 3.2 });
const cheap = makeProduct({ id: 1, name: 'Zumo de naranja', unitPrice: 0.85 });
const dear = makeProduct({ id: 3, name: 'Berberechos', unitPrice: 6.5 });

/** Deliberately not in any order the three options would produce. */
const fromTheShop = [mid, cheap, dear];

describe('listing a shelf', () => {
  it('leaves the shop order alone by default, because that order already groups', () => {
    expect(sortProducts(fromTheShop, 'shop').map((product) => product.id)).toEqual([2, 1, 3]);
  });

  it('puts the cheapest first', () => {
    expect(sortProducts(fromTheShop, 'price').map((product) => product.unitPrice)).toEqual([
      0.85, 3.2, 6.5,
    ]);
  });

  it('sorts A–Z by name', () => {
    expect(sortByName(fromTheShop).map((product) => product.name)).toEqual([
      'Aceite de oliva',
      'Berberechos',
      'Zumo de naranja',
    ]);
  });

  it('keeps catalogue order between equals, since the shop order is not noise', () => {
    const first = makeProduct({ id: 10, name: 'Uno', unitPrice: 1 });
    const second = makeProduct({ id: 11, name: 'Dos', unitPrice: 1 });

    expect(sortByPrice([first, second]).map((product) => product.id)).toEqual([10, 11]);
    expect(sortByPrice([second, first]).map((product) => product.id)).toEqual([11, 10]);
  });

  it('never reorders the array it was handed', () => {
    const original = [...fromTheShop];

    sortProducts(fromTheShop, 'price');

    expect(fromTheShop).toEqual(original);
  });
});
