export const expressions = [
  { key: 'neutral', name: 'ニュートラル' },
  { key: 'happy', name: '笑顔' },
  { key: 'sad', name: '悲しみ' },
  { key: 'angry', name: '怒り' },
  { key: 'fearful', name: '恐れ' },
  { key: 'disgusted', name: '嫌悪' },
  { key: 'surprised', name: '驚き' },
];
export function largestFace(results) {
  return results.reduce((largest, face) => !largest || face.detection.box.width * face.detection.box.height > largest.detection.box.width * largest.detection.box.height ? face : largest, null);
}
export function smoothScores(previous, next, weight = 0.4) {
  return Object.fromEntries(expressions.map(({ key }) => [key, previous ? previous[key] * (1 - weight) + next[key] * weight : next[key]]));
}
