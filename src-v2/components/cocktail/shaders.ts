/* Shaders GLSL de la scène du cocktail. Couleurs manipulées en espace linéaire. */

export const NB_GLACONS = 16

const BRUIT = /* glsl */ `
float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

float bruit(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash13(i), hash13(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z
  );
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * bruit(p);
    p = p * 2.03 + 11.7;
    a *= 0.5;
  }
  return v;
}
`

export { BRUIT }

/* Uniforms et fonctions partagés par tout ce qui « voit » le liquide */
const LIQUIDE_COMMUN = /* glsl */ `
#define NB_COUCHES 10
#define NB_GLACONS ${NB_GLACONS}

uniform vec3 uCouleurs[NB_COUCHES];
uniform float uClartes[NB_COUCHES];
uniform float uFond;
uniform float uPasCouche;
uniform float uNiveauMax;
uniform float uNiveau;
uniform float uAgitation;
uniform float uGrenadine;
uniform float uMelange;
uniform float uTemps;
uniform float uRayonFond;
uniform float uPenteRayon;
uniform vec3 uGrenadineCouleur;
uniform vec3 uRouge;
uniform vec3 uOrange;
uniform vec3 uAmbre;
uniform vec3 uFondScene;
uniform vec3 uNeon;
uniform vec3 uLumiere;
uniform mat4 uGlaceInv[NB_GLACONS];
uniform float uGlaceDemi;
uniform vec3 uPailleA;
uniform vec3 uPailleB;
uniform float uPailleR;
uniform float uPailleVisible;
uniform sampler2D uEnv;

#include <cube_uv_reflection_fragment>

vec3 environnement(vec3 direction, float rugosite) {
  return textureCubeUV(uEnv, direction, rugosite).rgb;
}

${BRUIT}

float rayonInterieur(float y) {
  return uRayonFond + uPenteRayon * max(y - uFond, 0.0);
}

vec3 degradeFinal(float y) {
  float k = clamp((y - uFond) / (uNiveauMax - uFond), 0.0, 1.0);
  vec3 c = mix(uRouge, uOrange, smoothstep(0.0, 0.42, k));
  return mix(c, uAmbre, smoothstep(0.42, 1.0, k));
}

// Couleur (rgb) et clarté (a) du liquide à la position p
vec4 teinteLiquide(vec3 p) {
  float angle = atan(p.z, p.x);
  vec3 cyc = vec3(cos(angle), sin(angle), 0.0) * 1.7;

  float h = (p.y - uFond) / uPasCouche;
  h += (bruit(cyc + vec3(0.0, 0.0, p.y * 1.3 + uTemps * 0.12)) - 0.5) * 0.3;
  float i0 = floor(h - 0.5);
  float f = h - 0.5 - i0;
  float w = smoothstep(0.3, 0.7, f);
  int a = int(clamp(i0, 0.0, 9.0));
  int b = int(clamp(i0 + 1.0, 0.0, 9.0));
  vec3 col = mix(uCouleurs[a], uCouleurs[b], w);
  float clarte = mix(uClartes[a], uClartes[b], w);

  // Remous pendant le versement : la nouvelle couche se mêle à la précédente
  float courantF = clamp(floor((uNiveau - uFond) / uPasCouche - 0.0001), 0.0, 9.0);
  int courant = int(courantF);
  int precedent = int(max(courantF - 1.0, 0.0));
  float zone = smoothstep(uNiveau - 1.4, uNiveau - 0.1, p.y) * uAgitation;
  float tourb = fbm(cyc * 1.3 + vec3(0.0, p.y * 2.2 - uTemps * 1.6, uTemps * 0.5));
  col = mix(col, mix(uCouleurs[precedent], uCouleurs[courant], smoothstep(0.35, 0.65, tourb)), zone * 0.75);
  clarte = mix(clarte, mix(uClartes[precedent], uClartes[courant], 0.5), zone * 0.5);

  // Grenadine : filaments qui plongent puis se déposent au fond
  if (uGrenadine > 0.001) {
    float hautG = uFond + 9.0 * uPasCouche;
    float centre = mix(hautG - 0.4, uFond + 0.7, uGrenadine);
    float filaments = smoothstep(0.4, 0.78, fbm(cyc * 3.0 + vec3(0.0, p.y * 0.55 + uGrenadine * 2.0, 5.0)));
    float nuage = exp(-pow((p.y - centre) / (0.9 + 0.9 * uGrenadine), 2.0)) * (0.35 + 0.65 * filaments) * (1.0 - uGrenadine * 0.55);
    float traine = filaments * step(centre, p.y) * step(p.y, hautG) * (1.0 - uGrenadine) * 0.5;
    float depot = uGrenadine * (1.0 - smoothstep(uFond, uFond + 3.8, p.y));
    float g = clamp(nuage + traine + depot, 0.0, 1.0);
    col = mix(col, uGrenadineCouleur, g * 0.85);
    clarte = mix(clarte, 0.2, g);
  }

  // Mélange : tourbillon qui fond les couches en dégradé
  if (uMelange > 0.001) {
    float tour = uMelange * (1.0 - uMelange) * 4.0;
    float ang = angle + tour * 2.5 + p.y * 0.35 * tour;
    vec3 cycTour = vec3(cos(ang), sin(ang), 0.0) * 2.0;
    float marbre = fbm(cycTour + vec3(0.0, p.y * 0.6, uMelange * 2.0));
    float seuil = smoothstep(marbre - 0.2, marbre + 0.2, uMelange * 1.5 - 0.25);
    col = mix(col, degradeFinal(p.y + (marbre - 0.5) * 2.5 * tour), seuil);
    clarte = mix(clarte, 0.1, seuil);
  }
  return vec4(col, clarte);
}

vec2 boite(vec3 ro, vec3 rd, vec3 demi, out vec3 n) {
  vec3 m = 1.0 / rd;
  vec3 k = abs(m) * demi;
  vec3 nn = m * ro;
  vec3 t1 = -nn - k;
  vec3 t2 = -nn + k;
  float tN = max(max(t1.x, t1.y), t1.z);
  float tF = min(min(t2.x, t2.y), t2.z);
  n = vec3(0.0);
  if (tN > tF || tF < 0.0) return vec2(-1.0);
  n = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
  return vec2(tN, tF);
}

float capsule(vec3 ro, vec3 rd, vec3 pa, vec3 pb, float r) {
  vec3 ba = pb - pa;
  vec3 oa = ro - pa;
  float baba = dot(ba, ba);
  float bard = dot(ba, rd);
  float baoa = dot(ba, oa);
  float rdoa = dot(rd, oa);
  float oaoa = dot(oa, oa);
  float a = baba - bard * bard;
  float b = baba * rdoa - baoa * bard;
  float c = baba * oaoa - baoa * baoa - r * r * baba;
  float h = b * b - a * c;
  if (h >= 0.0) {
    float t = (-b - sqrt(h)) / a;
    float y = baoa + t * bard;
    if (y > 0.0 && y < baba) return t;
    vec3 oc = (y <= 0.0) ? oa : ro - pb;
    b = dot(rd, oc);
    c = dot(oc, oc) - r * r;
    h = b * b - c;
    if (h > 0.0) return -b - sqrt(h);
  }
  return -1.0;
}

// Ce que l'on voit en regardant dans le liquide depuis p (sur sa surface), direction V
vec3 regardLiquide(vec3 p, vec3 V, vec3 N, float epaisseur) {
  vec4 t = teinteLiquide(p);
  vec3 col = t.rgb;
  float clarte = t.a;
  float densite = mix(0.42, 0.05, clarte);
  float absorbe = 1.0 - exp(-epaisseur * densite);

  vec3 opaque = col * mix(1.15, 0.58, absorbe);
  vec3 limpide = mix(uFondScene * 1.2 + col * 0.07, col * 0.26, absorbe * 0.5);
  vec3 c = mix(opaque, limpide, clarte);

  c *= 0.8 + 0.32 * max(dot(N, uLumiere), 0.0);
  float bord = pow(1.0 - abs(dot(N, -V)), 2.5);
  c += uNeon * bord * mix(0.04, 0.12, clarte);

  // Glaçons immergés, visibles à travers le liquide
  float tMin = epaisseur;
  vec3 nHit = vec3(0.0, 1.0, 0.0);
  bool touche = false;
  for (int k = 0; k < NB_GLACONS; k++) {
    vec3 ro = (uGlaceInv[k] * vec4(p, 1.0)).xyz;
    vec3 rd = (uGlaceInv[k] * vec4(V, 0.0)).xyz;
    vec3 n;
    vec2 h = boite(ro, rd, vec3(uGlaceDemi), n);
    if (h.x > 0.0 && h.x < tMin) {
      tMin = h.x;
      nHit = transpose(mat3(uGlaceInv[k])) * n;
      touche = true;
    }
  }
  if (touche && (p + V * tMin).y < uNiveau) {
    float vis = exp(-tMin * densite * 1.8);
    float fres = pow(1.0 - abs(dot(nHit, -V)), 3.0);
    vec3 glace = mix(c * mix(1.12, 1.6, clarte) + 0.008, vec3(0.8, 0.9, 0.88), 0.03 + fres * 0.3);
    c = mix(c, glace, vis * 0.75);
  }

  // Paille immergée
  if (uPailleVisible > 0.5) {
    float tp = capsule(p, V, uPailleA, uPailleB, uPailleR);
    if (tp > 0.0 && tp < tMin && (p + V * tp).y < uNiveau) {
      float vis = exp(-tp * densite * 1.5);
      c = mix(c, vec3(0.5, 0.3, 0.12) * (0.55 + 0.45 * c), vis * 0.85);
    }
  }
  return c;
}

// Petites bulles d'air qui remontent le long de la paroi
float bulles(vec3 p, float agitation) {
  float angle = atan(p.z, p.x);
  vec2 uv = vec2(angle * 3.2, p.y * 1.6 - uTemps * (0.35 + agitation * 1.8)) * 3.0;
  vec2 id = floor(uv);
  vec2 f = fract(uv);
  float h = hash13(vec3(id, 3.0));
  vec2 c = vec2(hash13(vec3(id, 7.0)), hash13(vec3(id, 13.0))) * 0.6 + 0.2;
  float r = 0.06 + 0.12 * hash13(vec3(id, 19.0));
  float d = length(f - c);
  float anneau = smoothstep(r, r * 0.7, d) - 0.55 * smoothstep(r * 0.65, r * 0.25, d);
  return anneau * step(1.0 - (0.04 + agitation * 0.22), h);
}
`

/* Paroi du liquide ---------------------------------------------------------- */

export const liquideVertex = /* glsl */ `
varying vec3 vPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const liquideFragment = /* glsl */ `
${LIQUIDE_COMMUN}
varying vec3 vPos;

void main() {
  vec3 p = vPos;
  if (p.y > uNiveau + 0.06) discard;
  vec3 V = normalize(p - cameraPosition);
  vec3 N = normalize(vec3(p.x, 0.0, p.z));
  if (dot(N, V) > 0.0) discard;

  float R = rayonInterieur(p.y);
  vec2 o = p.xz;
  vec2 d = V.xz;
  float a = dot(d, d);
  float b = 2.0 * dot(o, d);
  float c = dot(o, o) - R * R;
  float ep = a > 1e-5 ? (-b + sqrt(max(b * b - 4.0 * a * c, 0.0))) / (2.0 * a) : 20.0;
  if (V.y < 0.0) ep = min(ep, (uFond - p.y) / V.y);
  if (V.y > 0.0) ep = min(ep, (uNiveau - p.y) / V.y);

  vec3 col = regardLiquide(p, V, N, max(ep, 0.0));
  col += vec3(0.9, 0.95, 0.9) * bulles(p, uAgitation) * 0.2;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/* Surface du liquide (ménisque, ondes) -------------------------------------- */

export const surfaceVertex = /* glsl */ `
varying vec3 vPos;
varying float vRayon;
void main() {
  vec3 pos = position;
  float rn = length(pos.xz);
  vRayon = rn;
  pos.y += 0.06 * smoothstep(0.8, 1.0, rn);
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const surfaceFragment = /* glsl */ `
${LIQUIDE_COMMUN}
uniform vec2 uImpact;
varying vec3 vPos;
varying float vRayon;

void main() {
  vec3 p = vPos;
  vec3 V = normalize(p - cameraPosition);

  vec2 dI = p.xz - uImpact;
  float r = length(dI);
  float onde = cos(r * 7.0 - uTemps * 10.0) * exp(-r * 0.55) * uAgitation * 0.5;
  vec2 grad = (dI / max(r, 1e-3)) * onde;
  vec3 houle = vec3(p.x * 0.8, p.z * 0.8, uTemps * 0.25);
  grad += vec2(bruit(houle) - 0.5, bruit(houle + 5.0) - 0.5) * 0.1;
  vec3 N = normalize(vec3(-grad.x, 1.0, -grad.y));

  vec3 Vr = refract(V, N, 1.0 / 1.34);
  float R = rayonInterieur(uNiveau);
  vec2 o = p.xz;
  vec2 d = Vr.xz;
  float a = dot(d, d);
  float b = 2.0 * dot(o, d);
  float c = dot(o, o) - R * R;
  float ep = a > 1e-5 ? (-b + sqrt(max(b * b - 4.0 * a * c, 0.0))) / (2.0 * a) : 20.0;
  if (Vr.y < 0.0) ep = min(ep, (uFond - p.y) / Vr.y);

  vec3 col = regardLiquide(p - vec3(0.0, 0.12, 0.0), Vr, N, max(ep, 0.0));

  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, -V), 0.0), 5.0);
  vec3 Rv = reflect(V, N);
  col = mix(col, environnement(Rv, 0.02), fres * 0.85);
  col += vec3(1.0, 0.92, 0.78) * pow(max(dot(Rv, uLumiere), 0.0), 140.0) * 1.1;

  // Mousse légère au point d'impact
  float mousse = smoothstep(1.3, 0.0, r) * uAgitation * smoothstep(0.45, 0.8, fbm(vec3(p.xz * 3.0, uTemps * 2.0)));
  col = mix(col, vec3(0.95, 0.9, 0.8), mousse * 0.35);
  col += vec3(1.0, 0.95, 0.85) * smoothstep(0.9, 0.995, vRayon) * (1.0 - smoothstep(0.995, 1.0, vRayon)) * 0.22;

  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/* Glaçons ---------------------------------------------------------------------- */

export const glaceVertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormale;
varying vec3 vLocal;
void main() {
  vLocal = position;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  vNormale = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const glaceFragment = /* glsl */ `
${LIQUIDE_COMMUN}
uniform float uDemiLocal;
varying vec3 vPos;
varying vec3 vNormale;
varying vec3 vLocal;

void main() {
  vec3 V = normalize(vPos - cameraPosition);
  vec3 N = normalize(vNormale);
  float fres = pow(1.0 - abs(dot(N, -V)), 3.0);

  // Ce qu'on voit à travers le glaçon : liquide s'il est immergé, sinon la pénombre du bar
  vec3 derriere = vPos.y < uNiveau ? teinteLiquide(vPos).rgb * 0.85 : uFondScene * 1.1;

  // Arêtes arrondies qui accrochent la lumière
  vec3 a = abs(vLocal) / uDemiLocal;
  vec3 s = smoothstep(0.84, 0.99, a);
  float arete = max(max(s.x * s.y, s.y * s.z), s.x * s.z);

  // Lumière du bar réfractée à travers la glace (floue), un peu déformée
  float deformation = fbm(vLocal * 1.7);
  vec3 Tv = normalize(refract(V, N, 1.0 / 1.31) + (vec3(deformation) - 0.5) * 0.35);
  vec3 c = derriere * 0.8 + environnement(Tv, 0.3) * 0.36;

  // Diffusion de la lumière dans la masse de la glace
  c += vec3(0.07, 0.085, 0.085) * (0.3 + 0.7 * max(dot(N, uLumiere), 0.0));

  // Givre au cœur, par nappes
  float givre = fbm(vLocal * 2.4 + 7.0);
  c = mix(c, vec3(0.6, 0.72, 0.72), smoothstep(0.5, 0.8, givre) * 0.15 * (1.0 - fres));

  // Reflets de Fresnel et arêtes
  vec3 Rv = reflect(V, N);
  float F = 0.03 + 0.97 * pow(1.0 - abs(dot(N, -V)), 5.0);
  c = mix(c, environnement(Rv, 0.03), clamp(F * 0.9 + arete * 0.3, 0.0, 1.0));
  c += vec3(0.85, 0.95, 0.97) * arete * 0.06;

  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/* Filet versé ------------------------------------------------------------------ */

export const fluxVertex = /* glsl */ `
uniform float uTemps;
varying vec3 vPos;
varying vec3 vNormale;
void main() {
  vec3 pos = position;
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  float oscille = sin(wp.y * 1.7 + uTemps * 13.0) * 0.035 + sin(wp.y * 3.1 - uTemps * 9.0) * 0.02;
  wp.x += oscille;
  vPos = wp.xyz;
  vNormale = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const fluxFragment = /* glsl */ `
uniform vec3 uCouleur;
uniform float uClarte;
uniform float uTemps;
uniform vec3 uLumiere;
uniform vec3 uFondScene;
${BRUIT}
varying vec3 vPos;
varying vec3 vNormale;

void main() {
  vec3 V = normalize(vPos - cameraPosition);
  vec3 N = normalize(vNormale);
  float flot = bruit(vec3(vPos.x * 6.0, vPos.y * 2.5 + uTemps * 14.0, vPos.z * 6.0));
  vec3 c = uCouleur * (0.75 + 0.4 * flot);
  c = mix(c, uFondScene * 2.0 + uCouleur * 0.35, uClarte * 0.6);
  float fres = pow(1.0 - abs(dot(N, -V)), 2.0);
  c += vec3(1.0, 0.95, 0.85) * pow(max(dot(reflect(V, N), uLumiere), 0.0), 40.0) * 0.9;
  c = mix(c, c * 0.55, fres);
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/* Comptoir en bois clair ---------------------------------------------------------- */

export const comptoirVertex = /* glsl */ `
varying vec3 vPos;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vPos = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`

export const comptoirFragment = /* glsl */ `
uniform sampler2D uBois;
uniform vec3 uTeinte;
uniform float uRemplissage;
uniform vec3 uNeon;
uniform vec3 uFondScene;
varying vec3 vPos;

void main() {
  vec2 uv = vPos.xz * vec2(0.021, 0.048) + vec2(0.31, 0.12);
  vec3 bois = texture2D(uBois, uv).rgb;

  vec2 l = vPos.xz - vec2(-3.0, 3.5);
  float flaque = exp(-dot(l, l) / 230.0);
  vec3 c = bois * (0.06 + 0.62 * flaque);

  // Ombre de contact et ombre portée du verre
  float r = length(vPos.xz);
  c *= 1.0 - 0.7 * exp(-pow(max(r - 2.6, 0.0) / 1.2, 2.0));
  vec2 q = (vPos.xz - vec2(2.6, -2.8)) * vec2(0.55, 0.32);
  c *= 1.0 - 0.35 * exp(-dot(q, q) / 3.5);

  // Lumière colorée qui traverse le cocktail
  vec2 s = vPos.xz - vec2(3.2, 3.6);
  float caustique = exp(-dot(s * vec2(0.8, 1.0), s * vec2(0.8, 1.0)) / 6.5) * (0.8 + 0.2 * sin(length(s) * 5.0));
  c += uTeinte * uRemplissage * 0.32 * caustique;

  // Reflet lointain du néon
  vec2 n = vPos.xz - vec2(10.0, -12.0);
  c += uNeon * 0.03 * exp(-dot(n, n) / 160.0);

  float loin = smoothstep(7.0, 24.0, length((vPos.xz - vec2(0.0, 1.5)) * vec2(0.8, 1.15)));
  c = mix(c, uFondScene, loin);

  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

/* Fond : bokeh des lumières du bar -------------------------------------------------- */

export const fondVertex = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const fondFragment = /* glsl */ `
uniform vec3 uFondScene;
uniform vec3 uNeon;
varying vec2 vUv;

vec3 bokeh(vec2 uv, vec2 c, float r, vec3 col) {
  float d = length((uv - c) * vec2(2.2, 1.0));
  return col * smoothstep(r, r * 0.45, d);
}

void main() {
  vec3 c = uFondScene;
  c += bokeh(vUv, vec2(0.71, 0.64), 0.07, uNeon * 0.05);
  c += bokeh(vUv, vec2(0.63, 0.5), 0.045, uNeon * 0.035);
  c += bokeh(vUv, vec2(0.85, 0.42), 0.05, uNeon * 0.025);
  c += bokeh(vUv, vec2(0.29, 0.67), 0.06, vec3(1.0, 0.45, 0.12) * 0.04);
  c += bokeh(vUv, vec2(0.37, 0.54), 0.035, vec3(1.0, 0.6, 0.25) * 0.03);
  c += bokeh(vUv, vec2(0.18, 0.47), 0.04, vec3(1.0, 0.55, 0.2) * 0.02);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}
`
