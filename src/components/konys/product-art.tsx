import { Image, type ImageSource } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '@/constants/konys';
import { productPhotos } from '@/constants/product-media';
import type { Category } from '@/types/restaurant';
import { svgDataUri } from './svg-data-uri';

// Ilustración original de la app: una referencia visual, no una fotografía del plato.
const cone = `<defs><linearGradient id="dough" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F6CD8E"/><stop offset="1" stop-color="#CA8341"/></linearGradient><linearGradient id="cheese" x2="0" y2="1"><stop stop-color="#FFE6A8"/><stop offset="1" stop-color="#E5AA53"/></linearGradient></defs>
<ellipse cx="153" cy="265" rx="75" ry="12" fill="#052E3A" opacity=".1"/>
<g transform="rotate(-16 150 150)"><path d="M83 103Q150 76 217 103L161 263Q152 277 143 260Z" fill="url(#dough)" stroke="#B77C42" stroke-width="3"/><path d="m104 144 89 45m-81-17 71 36m-65-11 55 28m-44-58 61-33m-53 64 41-23m-34 50 25-14" stroke="#B57B43" stroke-width="2" opacity=".42"/>
<ellipse cx="150" cy="102" rx="70" ry="43" fill="#CC8B47"/><ellipse cx="150" cy="96" rx="62" ry="36" fill="#B4412A"/><path d="M91 92q21-34 57-27t58 29q0 27-21 30l-8 27q-4 7-9-2l-3-25q-29 8-44-6l-8 21q-5 6-7-3l-4-21Z" fill="url(#cheese)"/>
<g fill="#BD5037" stroke="#9C3D2D" stroke-width="2"><ellipse cx="122" cy="88" rx="12" ry="8"/><ellipse cx="169" cy="83" rx="11" ry="9"/><ellipse cx="158" cy="111" rx="12" ry="8"/><ellipse cx="189" cy="103" rx="10" ry="7"/></g>
<g fill="#417051"><path d="M133 102q-18-19-13-21 21 0 13 21Z"/><path d="M174 101q0-22 19-22-2 18-19 22Z"/><path d="M144 73q-11-20-4-24 15 12 4 24Z"/></g><g fill="#FFF0C5"><circle cx="143" cy="86" r="4"/><circle cx="113" cy="107" r="3"/><circle cx="179" cy="116" r="3"/></g>
<path d="m115 187 40 65 32-68q-31 17-72 3Z" fill="#FFF9ED"/><path d="m128 201 24 35 18-36" fill="none" stroke="#073847" stroke-width="3"/><path d="m141 207 18 0" stroke="#F47A20" stroke-width="4"/></g>`;
const drawings: Record<Category, string> = {
  pizzas: cone,
  entradas: '<ellipse cx="150" cy="205" rx="95" ry="30" fill="#E2D9C9"/><ellipse cx="150" cy="198" rx="90" ry="30" fill="#FFFDF7"/><g fill="#DCA859" stroke="#B37F3A" stroke-width="3"><path d="m65 181 30-69 37 12-30 70Z"/><path d="m115 187 18-79 38 9-18 78Z"/><path d="m162 189 8-72 39 8-7 72Z"/></g><g stroke="#437452" stroke-width="5"><path d="m90 145 12 4m35-1 13 2m27 9 12 2m-99 11 12 4m30-7 13 2"/></g>',
  postres: '<ellipse cx="151" cy="220" rx="85" ry="20" fill="#E5DCD3"/><path d="m80 133 138 0-25 76H96Z" fill="#623E32"/><path d="m80 133 138 0-20 27H87Z" fill="#9C6752"/><ellipse cx="148" cy="125" rx="58" ry="18" fill="#E3C3A5"/><path d="M107 120q0-57 42-57 47 0 47 57Z" fill="#FFEDCF"/><path d="m119 93 42-20m-52 41 74-25m-39 32 47-17" stroke="#A16543" stroke-width="4"/><circle cx="150" cy="63" r="10" fill="#BC4C38"/>',
  bebidas: '<ellipse cx="151" cy="240" rx="62" ry="12" fill="#D9E3D8"/><path d="m99 74 105 0-16 151q-38 17-73 0Z" fill="#E7EEE1" stroke="#ADC5B6" stroke-width="3"/><path d="m108 121 87 0-14 99q-30 12-59 0Z" fill="#EDC465"/><path d="m156 203 20-160 33-8" fill="none" stroke="#073847" stroke-width="7"/><g fill="#FFFCE5" opacity=".75"><path d="m119 142 24-5 5 24-25 5Z"/><path d="m156 173 21-5 5 22-23 5Z"/></g><circle cx="109" cy="95" r="27" fill="#C1D384" stroke="#638151" stroke-width="5"/><circle cx="109" cy="95" r="18" fill="#F0EDBA"/>',
};

export function ProductArt({ category = 'pizzas', dishId, name = 'Pizza en cono', hero = false, source }: {
  category?: Category; dishId?: string; name?: string; hero?: boolean; source?: ImageSource;
}) {
  const photo = source ?? (dishId ? productPhotos[dishId] : undefined);
  const [failed, setFailed] = useState(false);
  const actualPhoto = photo && !failed;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">${drawings[category]}</svg>`;
  return <View style={[styles.frame, hero && styles.hero]}>
    {!actualPhoto && <View style={[styles.halo, hero && styles.heroHalo]} />}
    <Image source={actualPhoto ? photo : { uri: svgDataUri(svg) }}
      style={styles.image} contentFit={actualPhoto ? 'cover' : 'contain'} accessibilityLabel={actualPhoto ? name : `Ilustración de ${category}`} onError={() => setFailed(true)} />
    {!actualPhoto && !hero && <Text style={styles.caption}>ILUSTRACIÓN</Text>}
  </View>;
}
const styles = StyleSheet.create({
  frame: { aspectRatio: 1.6, width: '100%', backgroundColor: colors.warm, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  hero: { backgroundColor: 'transparent', aspectRatio: 1.15 },
  halo: { width: '62%', aspectRatio: 1, borderRadius: radii.pill, backgroundColor: '#FAE3C9', position: 'absolute' },
  heroHalo: { backgroundColor: '#124C59', width: '80%' },
  image: { width: '100%', height: '100%' },
  caption: { position: 'absolute', right: 12, bottom: 10, fontSize: 8, color: colors.accentDark, letterSpacing: 1.1, fontWeight: '600' },
});
