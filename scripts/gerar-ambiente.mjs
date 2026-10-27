import { mkdirSync, writeFileSync } from 'node:fs';

try {
  process.loadEnvFile('.env');
} catch {
}

const url = (process.env.SUPABASE_URL ?? '').trim();
const chave = (process.env.SUPABASE_KEY ?? '').trim();

function parar(mensagem) {
  console.error(`\n✖ ${mensagem}\n`);
  process.exit(1);
}

//===== Validações ======
if (!url || !chave) {
  parar('Faltam as variáveis SUPABASE_URL e/ou SUPABASE_KEY.\n' +
    '  No computador: copia o .env.example para .env e preenche os valores.\n' +
    '  No GitHub: Settings > Secrets and variables > Actions.');
}

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
  parar('SUPABASE_URL inválido. Deve ser só o endereço base, ex.: https://xxxx.supabase.co (sem /rest/v1).');
}

//===== Proteção =====
if (chave.startsWith('sb_secret_')) {
  parar('Isto é uma chave SECRETA (sb_secret_...). Usa a chave publishable (sb_publishable_...) ou anon.');
}
if (chave.startsWith('eyJ')) {
  try {
    const conteudo = JSON.parse(Buffer.from(chave.split('.')[1], 'base64url').toString('utf8'));
    if (conteudo.role === 'service_role') {
      parar('Isto é a chave service_role, que ignora o RLS. Usa a chave anon.');
    }
  } catch {
    parar('SUPABASE_KEY não parece uma chave válida do Supabase.');
  }
} else if (!chave.startsWith('sb_publishable_')) {
  parar('SUPABASE_KEY não parece uma chave do Supabase (sb_publishable_... ou anon eyJ...).');
}

//===== Gerar os ficheiros =====
function conteudo(producao) {
  return `// Gerado automaticamente por scripts/gerar-ambiente.mjs. NÃO editar nem fazer commit.
export const environment = {
  production: ${producao},
  supabaseUrl: ${JSON.stringify(url)},
  supabaseKey: ${JSON.stringify(chave)},
};
`;
}

mkdirSync('src/environments', { recursive: true });
writeFileSync('src/environments/environment.ts', conteudo(true));
writeFileSync('src/environments/environment.development.ts', conteudo(false));

console.log('✔ Ficheiros de ambiente gerados (src/environments).');
