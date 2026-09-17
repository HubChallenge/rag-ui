# RAG UI

Interface web (React + TypeScript + Vite) pour discuter avec ses propres documents via un backend RAG 100 % local. Elle consomme l'API [`rag-api`](../rag-api).

## Fonctionnalités

- **Chat streamé** avec affichage progressif des tokens, bloc de « réflexion » repliable pour les modèles reasoning, et rendu Markdown (GFM) des réponses.
- **Citation des sources** : chaque réponse liste les documents/pages utilisés comme contexte, avec leur score de similarité.
- **Gestion de documents** : upload multi-fichiers (`.pdf`, `.docx`, `.txt`, `.md`), liste des documents indexés avec nombre de chunks, suppression individuelle.
- **Sessions multiples** : plusieurs conversations en parallèle, titrées automatiquement à partir du premier message, persistées dans le `localStorage` du navigateur.
- **Sélection du modèle** de chat parmi ceux disponibles sur l'instance Ollama.
- **Indicateur de santé** de l'API et de ses dépendances (Ollama / Qdrant).
- Interface entièrement en français.

## Stack technique

- [React 18](https://react.dev) + TypeScript
- [Vite](https://vitejs.dev) pour le dev server et le build
- [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm) pour le rendu des réponses
- [Bun](https://bun.sh) comme gestionnaire de paquets (un `bun.lock` est fourni ; `npm`/`pnpm` fonctionnent aussi)

## Structure

```
src/
├── main.tsx                    # Point d'entrée
├── App.tsx                      # État global : sessions, streaming, orchestration des appels API
├── api/
│   └── client.ts                 # Client HTTP + parsing du flux NDJSON de /chat/ask
├── sessions.ts                    # Persistance des sessions de conversation (localStorage)
├── types.ts                        # Types partagés (documents, sessions, messages, réponses API)
└── components/
    ├── ChatComposer.tsx             # Barre de saisie + accès aux popovers (sessions/documents/réglages)
    ├── Timeline.tsx                  # Historique de la conversation active (messages, réflexion, sources)
    ├── SessionsPanel.tsx              # Liste et gestion des sessions
    ├── DocumentsPanel.tsx              # Panneau documents (upload + liste)
    ├── UploadPanel.tsx                  # Upload de fichiers avec suivi de statut par fichier
    ├── DocumentList.tsx                  # Tableau des documents indexés + suppression
    └── SettingsPopover.tsx                # Sélection du modèle de chat
```

## Prérequis

- [Bun](https://bun.sh) (ou Node.js 18+)
- Le backend [`rag-api`](../rag-api) démarré et accessible

## Installation

```bash
bun install
cp .env.example .env   # puis ajuster si besoin
```

## Lancement

```bash
bun run dev
```

L'interface est servie sur `http://localhost:5173`.

## Scripts

| Commande | Description |
|---|---|
| `bun run dev` | Démarre le serveur de développement Vite |
| `bun run build` | Vérifie les types (`tsc -b`) puis build de production |
| `bun run preview` | Sert le build de production en local |

## Configuration (`.env`)

| Variable | Défaut | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | URL de base de l'API `rag-api` |

## Notes

- Les sessions de conversation sont stockées uniquement dans le `localStorage` du navigateur (clé `rag-ui-sessions-v1`) : elles ne sont pas partagées entre appareils et sont perdues si le stockage est vidé.
- Le bouton « Tout réinitialiser » du panneau documents appelle une route de suppression globale côté API qui n'est pas encore implémentée dans `rag-api` ; la suppression individuelle par document fonctionne normalement.
