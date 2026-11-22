#!/bin/sh
# Makes me.html (Siza's own entry) from index.html. RUN THIS after EVERY change to index.html, before the release (CLAUDE.md, .107).
# me.html = index.html + its own manifest (manifest-me.json: the icon opens me.html) + the one line window.RISEN_HOME='me'.
cd "$(dirname "$0")" || exit 1
sed -e 's|<link rel="manifest" href="manifest.json">|<link rel="manifest" href="manifest-me.json">|' \
    -e "s|<script src=\"db.js\"></script>|<script>window.RISEN_HOME='me';</script>\n<script src=\"db.js\"></script>|" index.html > me.html
grep -q "RISEN_HOME" me.html && grep -q "manifest-me.json" me.html && echo "me.html made" || { echo "ERROR: me.html is wrong"; exit 1; }
