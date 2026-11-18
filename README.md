# Infos utiles — site de partage

Petit site statique hébergé gratuitement sur **GitHub Pages**.

- `index.html` : la page publique (le lien à partager)
- `admin.html` : ta page pour ajouter / modifier / supprimer des blocs (texte ou lien)
- `posts.json` : le contenu du site (modifié automatiquement par l'admin)

---

## 1. Mettre le site en ligne (une seule fois)

1. Crée un compte sur https://github.com si tu n'en as pas.
2. Clique **New repository** → nom, par ex. `infos-proches` → **Public** → **Create repository**.
3. Sur la page du dépôt : **Add file → Upload files**, glisse les 6 fichiers
   (`index.html`, `admin.html`, `common.js`, `style.css`, `posts.json`, `README.md`) → **Commit changes**.
4. Va dans **Settings → Pages** :
   - *Source* : **Deploy from a branch**
   - *Branch* : **main** / **(root)** → **Save**
5. Après 1 à 2 minutes, ton site est en ligne à :

   `https://TON-PSEUDO.github.io/infos-proches/`

   👉 C'est **ce lien** que tu partages à tes proches.

## 2. Créer ton jeton d'accès (une seule fois)

Le jeton permet à la page d'admin d'enregistrer tes posts directement dans le dépôt.

1. GitHub → photo de profil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. *Token name* : `site-infos` · *Expiration* : au choix (ex. 1 an)
3. *Repository access* : **Only select repositories** → choisis `infos-proches`
4. *Permissions → Repository permissions → Contents* : **Read and write**
5. **Generate token** et copie la valeur (`github_pat_…`).

## 3. Ajouter des posts

1. Ouvre `https://TON-PSEUDO.github.io/infos-proches/admin.html`
2. Dans **⚙️ Connexion GitHub**, vérifie pseudo / dépôt (pré-remplis), colle le jeton → **Enregistrer et charger**
3. Choisis **💬 Texte** ou **🔗 Lien URL**, remplis, clique **Ajouter le bloc**
4. Quand tu as fini : **🚀 Publier sur le site**. Le site se met à jour en 1 à 2 minutes.

Tu peux aussi modifier, épingler en haut ou supprimer un bloc existant.

### Bon à savoir

- Le jeton est stocké **uniquement dans ton navigateur** (jamais dans le dépôt). Sur un autre appareil, il faudra le recoller.
- La page `admin.html` est visible publiquement mais **inutile sans ton jeton** : personne d'autre ne peut publier.
- Le dépôt étant public, le contenu de `posts.json` est lisible par toute personne qui a le lien : n'y mets pas d'informations sensibles (adresse, codes, numéros…).
- Sans jeton, le bouton **Télécharger posts.json** te permet de remplacer le fichier à la main sur GitHub (Upload files).

## 4. Plannings d'événements (onglets)

Dans `admin.html`, clique sur **📅 Plannings** :

1. **Nouveau planning** : nom (= nom de l'onglet), dates **Du / Au**, heures de début et de fin de la grille,
   format 24 h ou 12 h (AM/PM), et une note facultative affichée en haut. → **Créer le planning**
2. **Ajouter des événements** : titre, détails (ex. prix/dotation), jour, heure de début, heure de fin
   (par tranches de 30 min), **lien de réservation**, couleur (automatique ou au choix).
3. **🚀 Publier sur le site**.

Sur le site, chaque planning apparaît comme un **onglet** en haut de la page. Un clic sur un bloc
ouvre la page de réservation dans un nouvel onglet.

- Les événements qui se **chevauchent** sont placés automatiquement dans des colonnes séparées ;
  un événement qui commence quand un autre se termine reprend une colonne libre.
- Couleur automatique : les événements de même nom (ex. « Goro Open (3/4) » et « Goro Open (4/4) ») ont la même couleur.
- **⧉ Dupliquer** préremplit le formulaire avec un événement existant (pratique pour les séries).
- La grille s'élargit toute seule si un événement sort des heures prévues.
- Un planning « EOR — Dimanche (exemple) » est fourni : modifie-le ou supprime-le.
