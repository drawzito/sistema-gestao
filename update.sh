#!/bin/bash
echo "🚀 Iniciando sincronização completa dos arquivos..."

# Definindo caminhos
SOURCE_ROOT="/home/ixcsoft/.gemini/antigravity/scratch/sistema-gestao"
DEST_ROOT="/home/ixcsoft/Área de trabalho/sistema-gestao"

# 1. Copiar Backend (Server)
echo "📦 Atualizando Backend..."
cp "$SOURCE_ROOT/server/routes/employees.js" "$DEST_ROOT/server/routes/"
cp "$SOURCE_ROOT/server/routes/metrics.js" "$DEST_ROOT/server/routes/"
cp "$SOURCE_ROOT/server/routes/feedbacks.js" "$DEST_ROOT/server/routes/" 2>/dev/null
cp "$SOURCE_ROOT/server/server.js" "$DEST_ROOT/server/"
cp "$SOURCE_ROOT/server/knexfile.js" "$DEST_ROOT/server/"
cp "$SOURCE_ROOT/server/db.js" "$DEST_ROOT/server/"
cp "$SOURCE_ROOT/server/storage.js" "$DEST_ROOT/server/"
cp "$SOURCE_ROOT/server/migrate_to_cloud.js" "$DEST_ROOT/server/"
cp "$SOURCE_ROOT/server/.env" "$DEST_ROOT/server/" 2>/dev/null
cp "$SOURCE_ROOT/server/package.json" "$DEST_ROOT/server/"

# 2. Copiar Frontend (Client)
echo "🎨 Atualizando Frontend..."
SOURCE_SRC="$SOURCE_ROOT/client/src"
DEST_SRC="$DEST_ROOT/client/src"

cp "$SOURCE_SRC/App.jsx" "$DEST_SRC/"
cp "$SOURCE_SRC/components/EmployeeList.jsx" "$DEST_SRC/components/"
cp "$SOURCE_SRC/components/EmployeeDetail.jsx" "$DEST_SRC/components/"
cp "$SOURCE_SRC/components/MetricsPage.jsx" "$DEST_SRC/components/"
cp "$SOURCE_SRC/components/EmployeeFormModal.jsx" "$DEST_SRC/components/" 2>/dev/null
cp "$SOURCE_ROOT/client/package.json" "$DEST_ROOT/client/"
cp "$SOURCE_ROOT/.gitignore" "$DEST_ROOT/"
cp "$SOURCE_ROOT/update.sh" "$DEST_ROOT/"

echo "✅ Sincronização concluída com sucesso!"
echo "⚠️  IMPORTANTE: Reinicie o servidor do Backend para aplicar as mudanças."
