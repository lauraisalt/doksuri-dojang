/**
 * Script de rotina de backup automático do banco SQLite do Dojang Manager.
 * Pode ser executado manualmente ou agendado no Crontab / Agendador de Tarefas do servidor.
 * Exemplo de Crontab diário às 23h:
 * 0 23 * * * node /caminho/dojang-manager/scripts/backup-db.js >> /caminho/dojang-manager/backups/backup.log 2>&1
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const dbPath = path.join(rootDir, 'dev.db');
const backupDir = path.join(rootDir, 'backups');

if (!fs.existsSync(dbPath)) {
  console.error(`[BACKUP ERROR] ${new Date().toISOString()}: Banco de dados dev.db não encontrado em: ${dbPath}`);
  process.exit(1);
}

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const targetFile = path.join(backupDir, `backup-${timestamp}.db`);

try {
  fs.copyFileSync(dbPath, targetFile);
  const stats = fs.statSync(targetFile);
  console.log(`[BACKUP OK] ${new Date().toISOString()}: Backup gerado com sucesso -> ${targetFile} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  // Mantém apenas os últimos 30 backups para economizar disco
  const existingBackups = fs.readdirSync(backupDir)
    .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
    .sort()
    .reverse();

  if (existingBackups.length > 30) {
    const toDelete = existingBackups.slice(30);
    for (const file of toDelete) {
      try {
        fs.unlinkSync(path.join(backupDir, file));
        console.log(`[BACKUP ROTATION] Removido backup antigo: ${file}`);
      } catch (err) {
        console.error(`[BACKUP ROTATION ERROR] Não foi possível remover ${file}:`, err.message);
      }
    }
  }
} catch (err) {
  console.error(`[BACKUP ERROR] ${new Date().toISOString()}: Falha ao copiar arquivo de banco de dados:`, err);
  process.exit(1);
}
