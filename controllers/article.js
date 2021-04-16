'use strict'

var validator = require('validator');
var fs = require('fs');
var path = require('path');

var Article = require('../models/article');

var controller = {

    datosCurso: (req, res) => {

        return res.status(200).send({
            curso: 'Máster en frameworks JS',
            autor: 'Víctor Robles WEB',
            url: 'victorroblesweb.es'
        });
    },

    test: (req, res) => {
        return res.status(200).send({
            message: 'Soy la acción test de mi controlador de artículos'
        });
    },

    save: (req, res) => {
        // Recoger parametros por post
        var params = req.body;

        // Validar datos (validator)
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);

        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Faltan datos por enviar'
            });
        }

        if (validate_title && validate_content) {
            // Crear el objeto a guardar
            var article = new Article();

            //Asignar valores
            article.title = params.title;
            article.content = params.content;

            if(params.image){
                article.image = params.image;
            } else {
                article.image = null;
            }
            
            //Guardar el articulo
            article.save((err, articleStored) => {
                if (err || !articleStored) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'El artículo no se ha guardado'
                    });
                }

                // Devolver una respuesta
                return res.status(200).send({
                    status: 'success',
                    article: articleStored
                });
            });

        } else {
            return res.status(200).send({
                status: 'error',
                message: 'Los datos no son válidos'
            });
        }

    },

    getArticles: (req, res) => {

        var query = Article.find({});

        var last = req.params.last;
        if (last || last != undefined) {
            query.limit(5);
        }

        // Find
        query.sort('-_id').exec((err, articles) => {

            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al devolver los artículos'
                });
            }

            if (!articles) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay artículos para mostrar'
                });
            }

            return res.status(200).send({
                status: 'success',
                articles
            });
        });

    },

    getArticle: (req, res) => {

        // Recoger el id de la url
        var articleId = req.params.id;

        // Comprobar que existe
        if (!articleId || articleId == null) {
            return res.status(404).send({
                status: 'error',
                message: 'No existe el artículo'
            });
        }

        // Buscar el artículo
        Article.findById(articleId, (err, article) => {

            if (err || !article) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el artículo'
                });
            }

            // Devolverlo en JSON
            return res.status(200).send({
                status: 'success',
                article
            });
        });

    },

    update: (req, res) => {
        // Recoger el id del artículo por la url
        var articleId = req.params.id;

        // Recoger los datos que llegan por put
        var params = req.body;

        // Validar datos
        try {
            var validate_title = !validator.isEmpty(params.title);
            var validate_content = !validator.isEmpty(params.content);
        } catch (err) {
            return res.status(200).send({
                status: 'error',
                message: 'Faltan datos por enviar'
            });
        }

        if (validate_title && validate_content) {
            // Find and update
            Article.findOneAndUpdate({
                _id: articleId
            }, params, {
                new: true
            }, (err, articleUpdated) => {
                if (err) {
                    return res.status(500).send({
                        status: 'error',
                        message: 'Error al actualizar'
                    });
                }

                if (!articleUpdated) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No existe el artículo'
                    });
                }

                // Devolver respuesta
                return res.status(200).send({
                    status: 'success',
                    articleUpdated
                });
            });

        } else {
            return res.status(200).send({
                status: 'error',
                message: 'La validación no es correcta'
            });
        }

    },

    delete: (req, res) => {
        // Recoger el id de la url
        var articleId = req.params.id;

        // Find and delete
        Article.findOneAndDelete({
            _id: articleId
        }, (err, articleRemoved) => {
            if (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al borrar'
                });
            }

            if (!articleRemoved) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha borrado el artículo, posiblemente no exista'
                });
            }

            return res.status(200).send({
                status: 'success',
                articleRemoved
            });
        });

    },

    upload: (req, res) => {
        // Configurar el modulo connect multiparty router/article.js (hecho)

        // Recoger el fichero de la peticion
        var file_name = 'Imagen no subida...';

        if (!req.files) {
            return res.status(404).send({
                status: 'error',
                message: file_name
            })
        }

        // Conseguir nombre y extensión del archivo
        var file_path = req.files.file0.path;
        var file_split = file_path.split('\\');

        // * ADVERTENCIA* EN LINUX O MAC
        //var file_split = file_path.split('/');

        // Nombre del archivo
        var file_name = file_split[2];

        // Extensión del fichero
        var extension_split = file_name.split('\.');
        var file_ext = extension_split[1];

        // Comprobar la extensión, solo imágenes, si no es válida borrar el fichero
        if (file_ext != 'png' && file_ext != 'jpg' && file_ext != 'jpeg' && file_ext != 'gif') {
            // borrar el archivo subido
            fs.unlink(file_path, (err) => {
                return res.status(200).send({
                    status: 'error',
                    message: 'La extensión de la imagen no es válida'
                });
            });

        } else {
            // Si es valido, sacando id de la url
            var articleId = req.params.id;

            if (articleId){
                //Buscar el artículo, asignarle el nombe de la imagen y actualizarlo
                Article.findOneAndUpdate({_id: articleId}, {image: file_name}, {new: true}, (err, articleUpdated) => {

                    if(err || !articleUpdated){
                        return res.status(500).send({
                            status: 'error',
                            message: 'Error al guardar la imagen de artículo'
                        });
                    }

                    return res.status(200).send({
                        status: 'success',
                        article: articleUpdated
                    });
                });
            } else {
                return res.status(200).send({
                    status: 'success',
                    image: file_name
                });
            }
            

        }

    },   //end upload file

    getImage: (req, res) => {
        var file = req.params.image;
        var path_file = './upload/articles/' + file;

        if (fs.existsSync(path_file)) {
            return res.sendFile(path.resolve(path_file));
        } else {
            return res.status(404).send({
                status: 'error',
                mesagge: 'Ninguna image con este nombre'
            });
        }

    },

    search: (req, res) => {
        // Sacar el string a buscar
        var searchString = req.params.search;

        // Find or
        Article.find({ "$or": [
            { "title": { "$regex": searchString, "$options": "i"}},
            { "content": { "$regex": searchString, "$options": "i"}}
        ]})
        .sort([['date', 'descending']])
        .exec((err, articles) => {

            if(err){
                return res.status(500).send({
                    status: 'error',
                    mesagge: 'Error en la petición'
                });
            }

            if(!articles || articles.length <= 0){
                return res.status(404).send({
                    status: 'error',
                    mesagge: 'No hay artículos que coincidan con tu búsqueda'
                });
            }

            return res.status(200).send({
                status: 'success',
                articles
            });
        });

        
    }

}; // end controller

module.exports = controller;