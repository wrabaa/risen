# RISEN recipes

This folder IS the recipe pack. Change it and every phone that said YES to "Load RISEN recipes?" follows by itself the next
time RISEN is opened with internet (a minute or two after the change). No code change, no new release.

- `recipes.json` — the text of every recipe.
- one picture per recipe, named after the recipe's `id`: `tabbouleh.jpg` (`.jpg` best, `.png` / `.webp` fine, under 3 MB, about 1200 px wide).

## One recipe in `recipes.json`

```json
{
  "id": "tabbouleh",
  "category": "lunch",
  "name": "Tabbouleh",
  "serves": 2,
  "kcal": 180,
  "health": "One short line on why it is good for you.",
  "ingredients": ["2 bunches parsley", "2 tomatoes", "3 tbsp fine bulgur"],
  "method": "1. Chop the parsley.\n2. Mix everything.\n3. Dress with lemon and olive oil."
}
```

- `id`: small letters, digits and dashes. **Never change it and never reuse it** (it ties the recipe on the phones to its picture and to later corrections).
- `category`: `shakes`, `breakfast`, `lunch`, `snacks` or `dinner`.
- `serves`, `kcal` (per serving) and `health` are optional; they show on the recipe page when filled in.

## What phones do

- Correct a recipe here → it is corrected on the phones, unless the user changed that recipe himself (then it is his and is left alone).
- Add a recipe → it appears. Take one out → it goes, unless the user changed it.
- A recipe the user deleted stays deleted.
- This repo is public: anyone can see these files.
