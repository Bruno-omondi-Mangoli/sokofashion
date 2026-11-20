'use client';

import { useSyncExternalStore } from 'react';
import { addLine, clearShop, parseStoredCart, removeLine, setQuantity } from './cart-logic';
import type { CartLine } from './schemas';

const STORAGE_KEY = 'sokofashion-cart-v1';
const EMPTY: CartLine[] = [];

let memory: CartLine[] = EMPTY;
let lastText: string | null | undefined;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

/* Returns the same array until the stored text changes, which React needs */
function getSnapshot(): CartLine[] {
  let text: string | null;
  try {
    text = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memory;
  }
  if (text === lastText) {
    return memory;
  }
  lastText = text;
  memory = parseStoredCart(text);
  return memory;
}

function getServerSnapshot(): CartLine[] {
  return EMPTY;
}

function write(lines: CartLine[]) {
  memory = lines;
  const text = JSON.stringify({ version: 1, lines });
  try {
    window.localStorage.setItem(STORAGE_KEY, text);
    lastText = text;
  } catch {
    /* Storage is blocked or full. The cart still works until the page is closed. */
  }
  notify();
}

const subscribeNever = () => () => {};

export function useCart() {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  /* False while the server renders and during the first browser render, so pages do not flash an empty cart */
  const ready = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  return {
    lines,
    ready,
    add(line: CartLine): 'added' | 'full' {
      const result = addLine(getSnapshot(), line);
      write(result.lines);
      return result.status;
    },
    setQuantity(variantId: string, quantity: number) {
      write(setQuantity(getSnapshot(), variantId, quantity));
    },
    remove(variantId: string) {
      write(removeLine(getSnapshot(), variantId));
    },
    clearShop(shopSlug: string) {
      write(clearShop(getSnapshot(), shopSlug));
    },
  };
}
