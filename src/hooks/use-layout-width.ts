import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';

function subscribe(onChange: () => void) {
  const subscription = Dimensions.addEventListener('change', onChange);
  return () => subscription.remove();
}

const getWidth = () => Dimensions.get('window').width;
// React usa este mismo valor en SSR y al hidratar. Luego lee el ancho real.
const getServerWidth = () => 0;

export function useLayoutWidth(): number {
  return useSyncExternalStore(subscribe, getWidth, getServerWidth);
}
