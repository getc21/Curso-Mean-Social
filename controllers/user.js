'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var jwt = require('../services/jwt');
//METODOS DE PRUEBA
function home(req, res) {
    res.status(200).send({
        message: "Hola mundo desde el servidor de NodeJS"
    });
}
function pruebas(req, res) {
    res.status(200).send({
        message: "Accion de pruebas en el servidor de NodeJS"
    });
}
//METODO DE REGISTRO
function saveUser(req, res) {
    var params = req.body;
    var user = new User();

    if (params.name && params.surname &&
            params.nick && params.email && params.password) {

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        //Controlar usuarios duplicados
        User.find({$or: [
                {email: user.email.toLowerCase()},
                {nick: user.nick.toLowerCase()},
            ]}).exec((err, users) => {
            if (err)
                return res.status(500).send({message: 'Error en la peticion de usuarios'});

            if (users && users.length >= 1) {
                return res.status(200).send({message: 'El usuario que intentas registrar ya existe'});
            } else {
                //Cifra la password y guarda los datos                   
                bcrypt.hash(params.password, null, null, (err, hash) => {
                    user.password = hash;

                    user.save((err, userStored) => {
                        if (err)
                            return res.status(500).send({message: 'Error al guardar el usuario'});

                        if (userStored) {
                            res.status(200).send({user: userStored});
                        } else {
                            res.status(404).send({message: 'No ha registrado al usuario'});
                        }
                    });
                });
            }
        });

    } else {
        res.status(200).send({
            message: 'Envia todos los campos necesarios!!!'
        });
    }
}
//METODO DE LOGIN
function loginUser(req, res) {
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) => {
        if (err)
            return res.status(500).send({message: 'Error en la peticion'});

        if (user) {
            bcrypt.compare(password, user.password, (err, check) => {
                if (check) {
                    //devolver datos de usuario
                    if (params.gettoken) {
                        //GENERAR  y  Devolver token
                        return res.status(200).send({
                            token: jwt.createToken(user)
                        })
                    } else {
                        //Devolver datos de usuario
                        user.password = undefined;
                        return res.status(200).send({user});
                    }
                } else {
                    return res.status(404).send({message: 'El usuario no se ha podido identificar'});
                }
            });
        } else {
            return res.status(404).send({message: 'El usuario no se ha podido identificar'});
        }
    });
}

//CONSEGUIR DATOS DE UN USUARIO
function getUser(req, res){
    var userId = req.params.id;
    
    User.findById(userId, (err,user)=> {
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        
        if(!user) return res.status(404).send({message: 'El usuario no existe'});
        
        return res.status(200).send({user});
    });
}

//DEVOLVER UN LISTADO DE USUARIOS PAGINADO
function getUsers(req, res){
    var identity_user_id = req.user.sub;
    
    var page = 1;
    if(req.params.page){
        page = req.params.page;
    }
    
    var itemsPerPage = 5;
    
    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if(err) return res.status(500).send({message: 'Error en la peticion'});
        
        if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});
        
        return res.status(200).send({
           users,
           total,
           pages: Math.ceil(total/itemsPerPage)
        });
        
    });
}
module.exports = {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers
           

}