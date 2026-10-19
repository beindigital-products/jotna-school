/**
 * jsdom n'implémente pas la lecture de médias : `play()` y écrit « Not
 * implemented » et rend `undefined`. `lib/voice-player.ts` débloque son élément
 * audio au premier toucher de la page, donc tout test qui touche un exercice
 * y passe. Un `play` qui rend une promesse tenue évite le bruit ; un test qui
 * veut observer la lecture le surveille toujours (`vi.spyOn`).
 */
if (typeof HTMLMediaElement !== "undefined") {
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: () => Promise.resolve(),
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    writable: true,
    value: () => {},
  });
}
