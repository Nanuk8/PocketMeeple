import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Cargar .env
const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf-8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .replace(/"/g, "")
          .trim(),
      ];
    }),
);

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const SCREENSHOT_DIR = path.resolve("scratch/e2e-screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function prepareTestUser(email, password) {
  console.log("🔑 Asegurando que el usuario de prueba esté creado y confirmado en Supabase...");
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) {
    console.log(`- Usuario ${email} existe. Actualizando contraseña y confirmación...`);
    await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
  } else {
    console.log(`- Creando usuario ${email}...`);
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  }
  console.log("✅ Usuario listo para login.");
}

async function runE2E() {
  const email = "qa_tester_sk@pocketmeeple.app";
  const password = "TestPassword123!";

  await prepareTestUser(email, password);

  console.log("🚀 Iniciando Chromium para la prueba en navegador...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 900 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
  });
  const page = await context.newPage();

  try {
    console.log("1. Navegando a http://localhost:8080...");
    await page.goto("http://localhost:8080", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Revisar si estamos en pantalla de login
    if (page.url().includes("/login")) {
      console.log("2. Detectada pantalla de login. Autenticando usuario...");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01-login.png") });

      await page.fill("#email-login", email);
      await page.fill("#password-login", password);
      await page.click('button[type="submit"]:has-text("Ingresar")');

      // Esperar navegación fuera de login
      await page.waitForURL("http://localhost:8080/", { timeout: 10000 });
      console.log("✅ Login exitoso en el navegador.");
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02-home.png") });

    // 4. Ir a Jugadores y agregar 4 jugadores
    console.log("4. Gestionando 4 jugadores...");
    await page.goto("http://localhost:8080/players", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    const testPlayers = ["Garfio_QA", "Barbanegra_QA", "Anne_QA", "Sparrow_QA"];
    for (const playerName of testPlayers) {
      const exists = await page.locator(`text=${playerName}`).count();
      if (exists === 0) {
        console.log(`- Creando jugador: ${playerName}`);
        await page.fill('input[placeholder*="Nombre"]', playerName);
        await page.click("button:has(svg.lucide-user-plus)");
        await page.waitForTimeout(800);
      } else {
        console.log(`- Jugador ${playerName} ya existe.`);
      }
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03-players.png") });

    // 5. Ir a Skull King
    console.log("5. Iniciando partida limpia de Skull King (/play/skull-king?mode=new)...");
    await page.goto("http://localhost:8080/play/skull-king?mode=new", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "04-skull-king-setup.png") });

    // Seleccionar los 4 jugadores
    for (const playerName of testPlayers) {
      const alreadySelected = await page
        .locator(`div:has-text("Jugadores en la partida") >> button:has-text("${playerName}")`)
        .count();
      if (alreadySelected > 0) continue;

      const favBtn = page.locator(`button:has-text("${playerName}")`).first();
      if ((await favBtn.count()) > 0 && (await favBtn.isVisible())) {
        await favBtn.click();
        await page.waitForTimeout(300);
      } else {
        console.log(`- Buscando jugador ${playerName} en el selector...`);
        const searchBtn = page.locator('button:has-text("Buscar jugador…")');
        if (await searchBtn.isVisible()) {
          await searchBtn.click();
          await page.waitForTimeout(400);
          const item = page
            .locator(
              `[role="option"]:has-text("${playerName}"), [cmdk-item]:has-text("${playerName}")`,
            )
            .first();
          if ((await item.count()) > 0) {
            await item.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05-players-selected.png") });

    // Click en "¡Zarpar!"
    console.log("6. Clic en botón de inicio ¡Zarpar!...");
    const startBtn = page.locator('button:has-text("¡Zarpar!")');
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06-scoreboard-empty.png") });

    // 7. Llenar los puntajes de las 10 rondas con valores positivos y negativos
    console.log("7. Llenando las 10 rondas con valores positivos y negativos...");

    const roundData = [
      // Ronda 1: Garfio (+20), Barbanegra (-10), Anne (-10), Sparrow (+10)
      [
        { bid: 1, tricks: 1, bonus: 0 },
        { bid: 0, tricks: 1, bonus: 0 },
        { bid: 1, tricks: 0, bonus: 0 },
        { bid: 0, tricks: 0, bonus: 0 },
      ],
      // Ronda 2: Garfio (+50), Barbanegra (-20), Anne (+20), Sparrow (+20)
      [
        { bid: 2, tricks: 2, bonus: 10 },
        { bid: 0, tricks: 1, bonus: 0 },
        { bid: 1, tricks: 1, bonus: 0 },
        { bid: 0, tricks: 0, bonus: 0 },
      ],
      // Ronda 3: Garfio (+40), Barbanegra (-10), Anne (-10), Sparrow (+30)
      [
        { bid: 2, tricks: 2, bonus: 0 },
        { bid: 1, tricks: 0, bonus: 0 },
        { bid: 2, tricks: 1, bonus: 0 },
        { bid: 0, tricks: 0, bonus: 0 },
      ],
      // Ronda 4: Garfio (+80), Barbanegra (-40), Anne (+40), Sparrow (+20)
      [
        { bid: 3, tricks: 3, bonus: 20 },
        { bid: 0, tricks: 2, bonus: 0 },
        { bid: 2, tricks: 2, bonus: 0 },
        { bid: 1, tricks: 1, bonus: 0 },
      ],
      // Ronda 5: Garfio (+60), Barbanegra (-50), Anne (-20), Sparrow (+50)
      [
        { bid: 3, tricks: 3, bonus: 0 },
        { bid: 0, tricks: 1, bonus: 0 },
        { bid: 1, tricks: 3, bonus: 0 },
        { bid: 0, tricks: 0, bonus: 0 },
      ],
      // Ronda 6: Garfio (+80), Barbanegra (-20), Anne (+70), Sparrow (+20)
      [
        { bid: 4, tricks: 4, bonus: 0 },
        { bid: 2, tricks: 0, bonus: 0 },
        { bid: 3, tricks: 3, bonus: 10 },
        { bid: 1, tricks: 1, bonus: 0 },
      ],
      // Ronda 7: Garfio (+130), Barbanegra (-70), Anne (-20), Sparrow (+70)
      [
        { bid: 5, tricks: 5, bonus: 30 },
        { bid: 0, tricks: 3, bonus: 0 },
        { bid: 2, tricks: 0, bonus: 0 },
        { bid: 0, tricks: 0, bonus: 0 },
      ],
      // Ronda 8: Garfio (+100), Barbanegra (-30), Anne (+80), Sparrow (+40)
      [
        { bid: 5, tricks: 5, bonus: 0 },
        { bid: 1, tricks: 4, bonus: 0 },
        { bid: 4, tricks: 4, bonus: 0 },
        { bid: 2, tricks: 2, bonus: 0 },
      ],
      // Ronda 9: Garfio (+120), Barbanegra (-90), Anne (-20), Sparrow (+90)
      [
        { bid: 6, tricks: 6, bonus: 0 },
        { bid: 0, tricks: 2, bonus: 0 },
        { bid: 3, tricks: 1, bonus: 0 },
        { bid: 0, tricks: 0, bonus: 0 },
      ],
      // Ronda 10: Garfio (+190), Barbanegra (-100), Anne (+120), Sparrow (+20)
      [
        { bid: 7, tricks: 7, bonus: 50 },
        { bid: 0, tricks: 4, bonus: 0 },
        { bid: 5, tricks: 5, bonus: 20 },
        { bid: 1, tricks: 1, bonus: 0 },
      ],
    ];

    for (let r = 0; r < 10; r++) {
      console.log(`- Llenando Ronda ${r + 1}...`);
      for (let p = 0; p < 4; p++) {
        const item = roundData[r][p];
        const row = page.locator("tbody tr").nth(r);
        const cellBtn = row
          .locator("td")
          .nth(p + 1)
          .locator("button");
        await cellBtn.click();
        await page.waitForTimeout(150);

        const modal = page.locator('[role="dialog"]');
        await modal.waitFor({ state: "visible" });

        const inputs = modal.locator('input[type="number"]');
        await inputs.nth(0).fill(String(item.bid));
        await inputs.nth(1).fill(String(item.tricks));
        await inputs.nth(2).fill(String(item.bonus));

        await modal.locator('button:has-text("Guardar")').click();
        await modal.waitFor({ state: "hidden" });
        await page.waitForTimeout(100);
      }
    }

    console.log("8. Todas las 10 rondas completadas. Verificando totales en la tabla...");
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07-scoreboard-completed.png") });

    // 8. Verificar banner de partida completa y click en "Ver Podio"
    console.log('9. Clic en "Ver Podio"...');
    const finishBtn = page.locator('button:has-text("Ver Podio")');
    await finishBtn.waitFor({ state: "visible", timeout: 5000 });
    await finishBtn.click();
    await page.waitForTimeout(1500);

    console.log("10. En pantalla de Podio. Capturando resultados finales...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08-podium.png") });

    // 11. Guardar y Finalizar
    console.log('11. Clic en "Guardar y Finalizar"...');
    const saveBtn = page.locator('button:has-text("Guardar y Finalizar")');
    await saveBtn.click();
    await page.waitForTimeout(3000);

    console.log("12. En pantalla de Historial. Verificando partida registrada...");
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09-history.png") });

    console.log("🎉 ¡Prueba Browser E2E completada con ÉXITO!");
  } catch (err) {
    console.error("❌ Error durante la prueba E2E:", err);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "error-state.png") });
    throw err;
  } finally {
    await browser.close();
  }
}

runE2E();
