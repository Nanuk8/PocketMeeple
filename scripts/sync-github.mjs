import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const TOKEN = process.argv[2] || process.env.GITHUB_TOKEN;
const REPO_NAME = process.argv[3] || process.env.GITHUB_REPO || "PocketMeeple";
const COMMIT_MSG = process.argv[4] || `feat: sync project update (${new Date().toLocaleString()})`;

if (!TOKEN) {
  console.error("❌ Error: No se proporcionó el Token de GitHub.");
  console.error("Uso: node scripts/sync-github.mjs <TOKEN> [REPO_NAME] [COMMIT_MSG]");
  process.exit(1);
}

const ignoredPaths = [
  ".git",
  "node_modules",
  "dist",
  "dist-ssr",
  ".output",
  ".vinxi",
  ".tanstack",
  ".nitro",
  ".wrangler",
  ".dev.vars",
  ".env",
  ".env.local",
  ".vscode",
  ".idea",
  ".DS_Store",
  ".gemini",
  "bun.lockb",
  "package-lock.json"
];

function shouldIgnore(relPath) {
  const parts = relPath.split(path.sep);
  for (const part of parts) {
    if (ignoredPaths.includes(part)) return true;
    if (part.endsWith(".log")) return true;
    if (part.startsWith(".env")) return true;
  }
  return false;
}

function getAllFiles(dir, base = "") {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const relPath = path.join(base, file);
    if (shouldIgnore(relPath)) continue;

    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

async function githubRequest(endpoint, options = {}) {
  const url = endpoint.startsWith("http") ? endpoint : `https://api.github.com${endpoint}`;
  const headers = {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "PocketMeeple-Sync-Tool",
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`GitHub API Error [${res.status} ${res.statusText}] en ${url}:\n${errBody}`);
  }
  return res.json();
}

async function main() {
  console.log("🚀 Iniciando sincronización con GitHub...");

  // 1. Obtener usuario autenticado
  console.log("🔑 Verificando token...");
  const user = await githubRequest("/user");
  const owner = user.login;
  console.log(`👤 Conectado como: ${owner} (${user.name || user.login})`);

  // 2. Verificar o crear repositorio
  let repo;
  try {
    repo = await githubRequest(`/repos/${owner}/${REPO_NAME}`);
    console.log(`📁 Repositorio encontrado: https://github.com/${owner}/${REPO_NAME}`);
  } catch (err) {
    console.log(`📦 Creando repositorio '${REPO_NAME}' en GitHub...`);
    repo = await githubRequest("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name: REPO_NAME,
        description: "Ludiscore Application",
        private: false,
        auto_init: true
      })
    });
    console.log(`✅ Repositorio creado exitosamente: https://github.com/${owner}/${REPO_NAME}`);
  }

  // Verificar si el repositorio está vacío y necesita inicialización
  let parentCommitSha = null;
  try {
    const refData = await githubRequest(`/repos/${owner}/${REPO_NAME}/git/ref/heads/main`);
    parentCommitSha = refData.object.sha;
  } catch (e) {
    try {
      const refDataMaster = await githubRequest(`/repos/${owner}/${REPO_NAME}/git/ref/heads/master`);
      parentCommitSha = refDataMaster.object.sha;
    } catch (e2) {
      console.log("🌱 Inicializando repositorio vacío con commit inicial...");
      const initRes = await githubRequest(`/repos/${owner}/${REPO_NAME}/contents/README.md`, {
        method: "PUT",
        body: JSON.stringify({
          message: "Initial commit",
          content: Buffer.from(`# ${REPO_NAME}\n\nLudiscore application repository.\n`).toString("base64")
        })
      });
      parentCommitSha = initRes.commit.sha;
      console.log("✅ Repositorio inicializado.");
    }
  }

  // 3. Recopilar archivos
  console.log("🔍 Escaneando archivos locales (respetando .gitignore)...");
  const files = getAllFiles(rootDir);
  console.log(`📄 Total de archivos a sincronizar: ${files.length}`);

  // 4. Subir Blobs a GitHub
  console.log("⬆️  Subiendo contenido a GitHub...");
  const treeItems = [];
  const batchSize = 10;

  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (file) => {
        const fullPath = path.join(rootDir, file);
        const content = fs.readFileSync(fullPath);
        const base64Content = content.toString("base64");

        const blob = await githubRequest(`/repos/${owner}/${REPO_NAME}/git/blobs`, {
          method: "POST",
          body: JSON.stringify({
            content: base64Content,
            encoding: "base64"
          })
        });

        const normalizedPath = file.replace(/\\/g, "/");
        treeItems.push({
          path: normalizedPath,
          mode: "100644",
          type: "blob",
          sha: blob.sha
        });
      })
    );
    const progress = Math.min(i + batchSize, files.length);
    process.stdout.write(`\r   Progreso: ${progress}/${files.length} archivos procesados...`);
  }
  console.log("\n✅ Todos los archivos subidos.");

  // 5. Crear Árbol (Tree)
  console.log("🌳 Creando árbol de Git...");
  const tree = await githubRequest(`/repos/${owner}/${REPO_NAME}/git/trees`, {
    method: "POST",
    body: JSON.stringify({
      tree: treeItems
    })
  });

  // 6. Obtener commit padre (si existe)
  try {
    const refData = await githubRequest(`/repos/${owner}/${REPO_NAME}/git/ref/heads/main`);
    parentCommitSha = refData.object.sha;
  } catch (e) {
    // Si no está en main, mantener el que obtuvimos al inicializar
  }

  // 7. Crear Commit
  console.log("💾 Guardando commit...");
  const commitPayload = {
    message: COMMIT_MSG,
    tree: tree.sha
  };
  if (parentCommitSha) {
    commitPayload.parents = [parentCommitSha];
  }

  const commit = await githubRequest(`/repos/${owner}/${REPO_NAME}/git/commits`, {
    method: "POST",
    body: JSON.stringify(commitPayload)
  });

  // 8. Actualizar / Crear rama main
  console.log("🌿 Actualizando rama main...");
  if (parentCommitSha) {
    await githubRequest(`/repos/${owner}/${REPO_NAME}/git/refs/heads/main`, {
      method: "PATCH",
      body: JSON.stringify({
        sha: commit.sha,
        force: true
      })
    });
  } else {
    await githubRequest(`/repos/${owner}/${REPO_NAME}/git/refs`, {
      method: "POST",
      body: JSON.stringify({
        ref: "refs/heads/main",
        sha: commit.sha
      })
    });
  }

  console.log("\n🎉 ¡SINCRONIZACIÓN EXITOSA!");
  console.log(`🔗 Tu repositorio está disponible y actualizado en:\n   https://github.com/${owner}/${REPO_NAME}\n`);
}

main().catch((err) => {
  console.error("\n❌ Error durante la sincronización:", err.message);
  process.exit(1);
});
