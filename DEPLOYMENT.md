# Mr Electron deployment

The project is intentionally split into four deployable units:

| Unit | Local URL | Production role |
| --- | --- | --- |
| `api` | `http://localhost:3000` | Node/Express process managed by PM2 |
| `landingpage` | `http://localhost:5173` | Public static landing page |
| `student` | `http://localhost:5174` | Static student SPA |
| `admin` | `http://localhost:5175` | Static teacher/admin SPA |

The recommended production shape is three static origins plus one API origin:

- `https://mrelectron.example` → `landingpage/dist`
- `https://student.mrelectron.example` → `student/dist`
- `https://admin.mrelectron.example` → `admin/dist`
- `https://api.mrelectron.example` → PM2 on port `3000`

The landing page is not coupled to the API. Its `VITE_STUDENT_URL` and `VITE_ADMIN_URL` values are baked into the static build and turn its buttons into links to the student login/register and teacher login pages. The student and admin apps call the API through `VITE_API_URL`; their auth tokens are stored in browser local storage and sent as Bearer tokens.

## Local run

```bash
cp api/.env.example api/.env
cp landingpage/.env.example landingpage/.env.local
cp student/.env.example student/.env.local
cp admin/.env.example admin/.env.local

# Put a local MongoDB URL and a real development JWT_SECRET in api/.env.
npm --prefix api install
npm --prefix landingpage install
npm --prefix student install
npm --prefix admin install

./start-all.sh
```

On Windows, run `start-all.bat` from this folder. Vite ports are fixed so the links in the local environment stay stable.

## Production build

Create `.env.production.local` in each static app using the production URLs from its `.env.example`, then build:

```bash
npm --prefix api ci
npm --prefix api run build

npm --prefix landingpage ci && npm --prefix landingpage run build
npm --prefix student ci && npm --prefix student run build
npm --prefix admin ci && npm --prefix admin run build
```

Serve each `dist` folder with an SPA fallback to its own `index.html`. The landing page can be served as a normal static site; student and admin need the fallback because they use React Router.

## PM2

Install PM2 once on the server if it is not already available:

```bash
npm install --global pm2
```

The API ecosystem file runs the compiled server from `api/dist/server.js` and loads `api/.env` through the API's existing dotenv setup:

```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
pm2 logs mr-electron-api
```

After a deployment:

```bash
npm --prefix api run build
pm2 reload ecosystem.config.cjs --env production
```

Before testing the frontends, verify `https://api.mrelectron.example/api/health` and make sure `CLIENT_URL` contains the exact origins of the landing, student, and admin sites. `CLIENT_URL` accepts comma-separated origins without trailing paths.

## Static server note

For Nginx, each SPA server block should use the equivalent of:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

The API should be reverse-proxied to `127.0.0.1:3000`, while MongoDB should not be exposed publicly.

## GitHub Actions CI/CD

The repository includes `.github/workflows/ci-cd.yml`. Pull requests build the affected apps without deploying. A push to `main` detects the changed deployables, builds only those payloads, uploads only those `dist` folders, and restarts PM2 only when the API or its ecosystem config changed. A manual `workflow_dispatch` is treated as a full deployment.

Create these **Repository variables** in GitHub under `Settings → Secrets and variables → Actions → Variables`:

```text
DEPLOY_HOST=your.server.com
DEPLOY_PORT=22
DEPLOY_USER=deploy
DEPLOY_ROOT=/var/www/mr-electron
API_HEALTH_URL=https://api.mrelectron.example/api/health

VITE_API_URL=https://api.mrelectron.example/api
VITE_LANDING_URL=https://mrelectron.example
VITE_STUDENT_URL=https://student.mrelectron.example
VITE_ADMIN_URL=https://admin.mrelectron.example
VITE_LOGIN_URL=https://student.mrelectron.example/login
VITE_SIGNUP_URL=https://student.mrelectron.example/register
```

Create these **Repository secrets** in the same Actions page:

```text
DEPLOY_SSH_KEY       # private ed25519 key for the deploy user
DEPLOY_KNOWN_HOSTS   # output of: ssh-keyscan -H your.server.com
```

The server must have Node.js/npm, PM2, rsync, MongoDB, and Nginx installed. Keep the real production secrets in `$DEPLOY_ROOT/api/.env`; the workflow never uploads or replaces that file. The deploy user needs SSH access and write permission to `$DEPLOY_ROOT`, and PM2 must have been initialized once with `pm2 startup` and `pm2 save`.

If Bunny Stream is enabled, add `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, and `BUNNY_STREAM_TOKEN_KEY` to that server-side `.env`. The admin browser receives a short-lived upload session only; Bunny credentials never enter a static frontend build.

Point Nginx at these folders:

```text
$DEPLOY_ROOT/landingpage/dist
$DEPLOY_ROOT/student/dist
$DEPLOY_ROOT/admin/dist
```

The first push to `main` performs the initial deployment. After that, a student-only change updates only `student/dist`; an API-only change updates `api/dist` and reloads `mr-electron-api`; a docs-only change does nothing.
