// Minimal zustand-compatible create() implementation so the filter store works
// without adding a new dependency. Provides the subset of the API used here:
// create(stateCreator) -> hook(selector?) with getState/setState/subscribe.
import { useSyncExternalStore } from 'react';

type SetState<T> = (
  partial: Partial<T> | ((state: T) => Partial<T>),
  replace?: boolean,
) => void;
type GetState<T> = () => T;
type StateCreator<T> = (set: SetState<T>, get: GetState<T>) => T;

export function create<T>(creator: StateCreator<T>) {
  let state: T;
  const listeners = new Set<() => void>();

  const setState: SetState<T> = (partial, replace) => {
    const nextPartial =
      typeof partial === 'function'
        ? (partial as (s: T) => Partial<T>)(state)
        : partial;
    state = replace
      ? (nextPartial as T)
      : { ...state, ...nextPartial };
    listeners.forEach((l) => l());
  };

  const getState: GetState<T> = () => state;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  state = creator(setState, getState);

  function useStore(): T;
  function useStore<U>(selector: (state: T) => U): U;
  function useStore<U>(selector?: (state: T) => U) {
    const sel = selector || ((s: T) => s as unknown as U);
    return useSyncExternalStore(
      subscribe,
      () => sel(state),
      () => sel(state),
    );
  }

  (useStore as any).getState = getState;
  (useStore as any).setState = setState;
  (useStore as any).subscribe = subscribe;

  return useStore as typeof useStore & {
    getState: GetState<T>;
    setState: SetState<T>;
    subscribe: (l: () => void) => () => void;
  };
}

export default create;
