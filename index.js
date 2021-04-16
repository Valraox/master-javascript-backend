'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3900;
var appUrl = 'http://localhost';

mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/api_rest_blog', {
        useUnifiedTopology: true,
        useNewUrlParser: true
    })
    .then(() => {
        console.log('La conexión a la base de datos se ha realizado correctamente');

        // Crear servidor y ponerme a escuchar peticiones HTTP
        app.listen(port, () => {
            console.log('Servidor corriendo en ' + appUrl + ':' + port);
        });
    });