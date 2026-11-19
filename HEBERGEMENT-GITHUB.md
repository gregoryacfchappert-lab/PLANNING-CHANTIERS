# Héberger l'application ACF CHAPPERT sur GitHub Pages

L'application est un **fichier HTML autonome** : elle s'héberge telle quelle, sans serveur ni installation.

## Mise en ligne (5 minutes)

1. Créez un dépôt GitHub, par exemple `DEVIS-ACF` (public ou privé).
2. Renommez `devis-acf-chappert.html` en **`index.html`**.
3. Déposez ce fichier `index.html` à la racine du dépôt (glisser-déposer sur github.com → *Add file* → *Upload files* → *Commit*).
4. Dans le dépôt : **Settings → Pages → Build and deployment → Source : Deploy from a branch → Branch : `main` / `/root` → Save**.
5. Au bout d'une minute, l'app est en ligne à l'adresse :
   `https://<votre-compte>.github.io/DEVIS-ACF/`

## Fiches de chantier

Les fiches web générées (bouton **🌐 Page web**) se déposent dans votre dépôt existant
`FICHES-CHANTIERS/fiches/`. Le bouton **🔗 Copier le lien** construit automatiquement l'URL
`https://gregoryacfchappert-lab.github.io/FICHES-CHANTIERS/fiches/<nom>.html`.

## Points importants sur les données

- Les données (devis, clients, produits, techniciens, planning…) sont stockées **dans le navigateur**
  (localStorage), liées à l'adresse du site et à l'appareil.
- Elles **ne se synchronisent pas** automatiquement entre deux ordinateurs ou deux navigateurs.
- Pour un usage **multi-postes avec base partagée**, il faudra ajouter un vrai stockage en ligne
  (base de données / backend). C'est l'étape suivante possible ; l'app est déjà structurée pour l'accueillir.
- Pensez à sauvegarder régulièrement : une fonction d'export/sauvegarde de toute la base peut être ajoutée
  si vous le souhaitez (fichier à archiver ou à transférer sur un autre poste).

## Bibliothèques externes

L'app charge en ligne (via HTTPS) : jsPDF, html2canvas, pdf.js et SheetJS pour la génération PDF,
la rasterisation des PDF joints et l'import Excel. Hébergée sur GitHub Pages (donc en ligne),
tout fonctionne. Hors connexion, seuls l'impression PDF et le CSV restent disponibles.
