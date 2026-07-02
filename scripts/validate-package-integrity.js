const fs = require('fs');
const path = require('path');

const libRoot = path.join(__dirname, '../projects/ktortu/aaa');
const publicApiFile = path.join(libRoot, 'src/public-api.ts');
const ngPackageFile = path.join(libRoot, 'ng-package.json');

// 1. Lire les fichiers de configuration et d'export
const publicApiContent = fs.readFileSync(publicApiFile, 'utf8');
const ngPackage = JSON.parse(fs.readFileSync(ngPackageFile, 'utf8'));
const assets = ngPackage.assets || [];

// Fonction pour chercher récursivement des fichiers CSS
function hasCssFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (hasCssFiles(fullPath)) return true;
    } else if (file.endsWith('.css')) {
      return true;
    }
  }
  return false;
}

// Lire tous les répertoires sous la racine de la bibliothèque
const items = fs.readdirSync(libRoot);
let hasErrors = false;

for (const item of items) {
  const itemPath = path.join(libRoot, item);
  const stat = fs.statSync(itemPath);
  
  if (stat.isDirectory()) {
    const ngPkgPath = path.join(itemPath, 'ng-package.json');
    if (fs.existsSync(ngPkgPath)) {
      // C'est un point d'entrée secondaire (sous-package)
      console.log(`Vérification de l'intégrité du sous-package : ${item}`);
      
      // A. Vérification de l'exportation dans le public-api principal
      const exportPattern = `@ktortu/aaa/${item}`;
      if (!publicApiContent.includes(exportPattern)) {
        console.error(`❌ Erreur : Le sous-package '${item}' n'est pas exporté dans '${publicApiFile}'.`);
        console.error(`   Veuillez ajouter : export * from '${exportPattern}';`);
        hasErrors = true;
      }
      
      // B. Vérification des styles CSS dans les assets de ng-package.json
      if (hasCssFiles(itemPath)) {
        const hasAssetRule = assets.some(asset => {
          return asset.startsWith(`./${item}/`) && asset.endsWith('.css');
        });
        
        if (!hasAssetRule) {
          console.error(`❌ Erreur : Des fichiers CSS sont présents dans '${item}', mais aucune règle correspondante n'a été trouvée dans les assets de '${ngPackageFile}'.`);
          console.error(`   Veuillez ajouter une règle de type './${item}/*.css' ou './${item}/**/*.css' dans les assets.`);
          hasErrors = true;
        }
      }
    }
  }
}

if (hasErrors) {
  console.error('\n❌ Échec de la vérification d\'intégrité de la bibliothèque.');
  process.exit(1);
} else {
  console.log('\n✔ L\'intégrité de la bibliothèque est valide (tous les sous-packages sont exportés et configurés).');
  process.exit(0);
}
