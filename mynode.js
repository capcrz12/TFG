const fs = require('fs');
const path = require('path');
const successColor = '\x1b[32m%s\x1b[0m';
const checkSign = '\u{2705}';
const dotenv = require('dotenv').config({path: 'src/.env'}); ;

const envFile = `export const environment = {
    APIUrl: '${process.env.APIUrl}',
    mapKey: '${process.env.mapKey}'
};
`;

const targetDir = path.join(__dirname, './src/environments');
const targetPath = path.join(targetDir, 'environment.prod.ts');

console.log(successColor, `${checkSign} ${targetPath}`);

// Crear la carpeta 'environments' si no existe
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFile(targetPath, envFile, (err) => {
    if (err) {
        console.error(err);
        throw err;
    } else {
        console.log(successColor, `${checkSign} Successfully generated environment.development.ts`);
    }
});