const fs = require('fs');
const path = require('path');
const successColor = '\x1b[32m%s\x1b[0m';
const checkSign = '\u{2705}';
const dotenv = require('dotenv').config({path: 'src/.env'}); ;

const prodFile = `export const environment = {
    APIUrl: '${process.env.APIUrl}',
    mapKey: '${process.env.mapKey}'
};
`;

const envFile = `export const environment = {};`;

const targetDir = path.join(__dirname, './src/environments');
const envPath = path.join(targetDir, 'environment.ts');
const prodPath = path.join(targetDir, 'environment.prod.ts');

// Crear la carpeta 'environments' si no existe
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFile(envPath, envFile, (err) => {
    if (err) {
        console.error(err);
        throw err;
    } else {
        console.log(successColor, `${checkSign} Successfully generated environment.ts`);
    }
});

fs.writeFile(prodPath, prodFile, (err) => {
    if (err) {
        console.error(err);
        throw err;
    } else {
        console.log(successColor, `${checkSign} Successfully generated environment.prod.ts`);
    }
});