import { describe, expect, it } from 'vitest';

import { addItem, createCart, toggleChecked } from '../src/lib/cart.ts';
import {
  decodeSharePayload,
  encodeSharePayload,
  mergeCarts,
  readSharePayload,
  shareUrl,
} from '../src/lib/joint-session.ts';

/*
  Two devices and one link, end to end.

  The unit tests prove each rule on its own. What this covers is the whole errand: A
  builds a list, the link goes across as a URL, B merges it, ticks something off, sends it
  back, and A sees the tick. If any one of those steps stops agreeing with the others, the
  feature is broken even though every unit test still passes.
*/
describe('a list carried from one device to another', () => {
  const sid = 'A7fK2qAAAAAAAAAAAAAAAA';
  const t0 = new Date('2026-10-12T12:00:00Z');
  const origin = 'https://carrito.dev';

  /** A link as it would be opened: put through URL parsing, as a chat client would. */
  function open(link: string) {
    const payload = readSharePayload(new URL(link).hash);
    return payload === null ? null : decodeSharePayload(payload, t0);
  }

  /** The lines a cart holds, sorted — what two devices have to agree on. */
  function contents(cart: { items: { productId: number }[] }) {
    return cart.items.map((item) => item.productId).sort((a, b) => a - b);
  }

  it('survives URL parsing, so the fragment arrives intact', () => {
    const onA = addItem(createCart(t0), 7, t0);
    const arriving = open(shareUrl(encodeSharePayload(sid, onA) as string, origin));

    expect(arriving?.sessionId).toBe(sid);
    expect(arriving?.cart.items.map((item) => item.productId)).toEqual([7]);
  });

  it('carries a list across, and back again after a change on the other device', () => {
    const onA = addItem(addItem(createCart(t0), 7, t0), 3, t0);

    // B opens the link and merges it into the list it already had.
    const arriving = open(shareUrl(encodeSharePayload(sid, onA) as string, origin));
    expect(arriving).not.toBeNull();
    const onB = mergeCarts(addItem(createCart(t0), 9, t0), arriving!.cart, t0);
    expect([...onB.items.map((item) => item.productId)].sort((a, b) => a - b)).toEqual([3, 7, 9]);

    // B ticks something off and sends the list back; A merges and sees it ticked.
    const checkedOnB = toggleChecked(onB, 7, t0);
    const back = open(shareUrl(encodeSharePayload(sid, checkedOnB) as string, origin));

    const onA2 = mergeCarts(onA, back!.cart, t0);
    expect(onA2.items.find((item) => item.productId === 7)?.checked).toBe(true);
    expect(onA2.items).toHaveLength(3);
  });

  it('carries no timestamps, so no other device learns the time of day it was built', () => {
    const onA = addItem(createCart(t0), 7, t0);

    const payload = encodeSharePayload(sid, onA) as string;

    expect(payload).not.toContain('2026');
    expect(payload).toBe(`1.${sid}.7`);
  });

  it('sends an empty list as an empty list, rather than as no link at all', () => {
    const link = shareUrl(encodeSharePayload(sid, createCart(t0)) as string, origin);

    expect(open(link)?.cart.items).toEqual([]);
  });

  it('leaves both devices on one list once the link has gone both ways', () => {
    const onA = addItem(createCart(t0), 7, t0);
    const onB = addItem(createCart(t0), 9, t0);

    // A sends; B merges what arrived into what it already had.
    const fromA = open(shareUrl(encodeSharePayload(sid, onA) as string, origin));
    const onB2 = mergeCarts(onB, fromA!.cart, t0);

    // B sends back; A merges. Neither device was privileged, and both agree.
    const fromB = open(shareUrl(encodeSharePayload(sid, onB2) as string, origin));
    const onA2 = mergeCarts(onA, fromB!.cart, t0);

    expect(contents(onA2)).toEqual(contents(onB2));
    expect(contents(onA2)).toEqual([7, 9]);
  });
});
