# Italiano

PWA para aprender las **5000 palabras italianas más usadas**, de **100 en 100**.

- Cards, ABC y escritura (ES → IT)
- Frases por pack
- Progreso en **IndexedDB del teléfono** (Dexie) — sin cuenta ni backend
- Desplegable en Vercel como estático

## Desarrollo

```bash
npm install
npm run build:phrases   # regenera frases
# opcional: python3 scripts/build-words.py  # regenera traducciones
npm run dev
```

## Deploy

```bash
npm run build
vercel --prod
```
