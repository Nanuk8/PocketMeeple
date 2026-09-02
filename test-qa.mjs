import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Leer el archivo .env manualmente
const env = Object.fromEntries(
  fs
    .readFileSync(".env", "utf-8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [
        l.slice(0, i),
        l
          .slice(i + 1)
          .replace(/"/g, "")
          .trim(),
      ];
    }),
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  console.log("🧪 Iniciando prueba QA Automation...");
  console.log("Conectando a Supabase URL:", env.SUPABASE_URL);

  console.log('\nSimulando acción: Crear jugador "Test QA"...');
  const { data, error } = await supabase
    .from("players")
    .insert({ name: "Test QA" })
    .select()
    .single();

  if (error) {
    console.error("❌ Resultado: FALLO. Error de Supabase:");
    console.error(error);
  } else {
    console.log("✅ Resultado: ÉXITO. Jugador guardado en la base de datos:");
    console.log(data);
  }
}

runTest();
