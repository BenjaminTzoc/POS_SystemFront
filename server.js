const express = require('express');
const path = require('path');
const app = express();

// Directorio donde Angular genera el build
// Asegúrate de que coincida con lo que ves en tu carpeta /dist
const DIST_PATH = path.join(__dirname, 'dist/sistema-pos-frontend/browser');

app.use(express.static(DIST_PATH));

// Manejo de todas las rutas para Angular (SPA)
app.get('/*', (req, res) => {
    res.sendFile(path.join(DIST_PATH, 'index.html'));
});

// Seenode suele usar enviroment variables para el puerto
const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log(`Frontend servido en el puerto ${port}`);
});
