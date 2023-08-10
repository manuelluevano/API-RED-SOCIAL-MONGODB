const Follow = require("../models/follow");
const User = require("../models/user");

//importar dependencias
const mongoosePagination = require("mongoose-pagination");

//Importar Servicio
const followService = require("../services/followService");

//Acciones de prueba
const pruebaFollow = (req, res) => {
  return res.status(200).send({
    mensaje: "Mensaje enviado desde el controlador Follow",
  });
};

//ACCION DE GUARDAR UN FOLLOW O SEGUIR
const save = async (req, res) => {
  //CONSEGUIR DATOS POR BODY
  const idFollowed = req.body;

  // console.log(idFollowed);

  if (!idFollowed.followed) {
    return res.status(404).json({
      //devolver error
      status: "error",
      mensaje: "No Hay id de usuario",
    });
  }

  //SACAR ID DEL USUARIO IDENTIFICADO
  const identify = req.user;

  //CREAR OBJETO CON MODELO FOLLOW
  let userToFollow = new Follow({
    user: identify.id,
    followed: idFollowed.followed,
  });

  //GUARDAR OBJETO EN DB
  userToFollow
    .save()
    .then((followStore) => {
      //DAR RESPUESTA
      return res.status(200).send({
        status: "success",
        identify: identify,
        follow: followStore,
      });
    })
    .catch((error) => {
      return res.status(400).json({
        //devolver error
        status: "error",
        mensaje: "No se podido seguir a la persona: " + error.message,
      });
    });
};

//ACCION DE BORRAR UN FOLLOW O DEJAR DE SEGUIR
const unFollow = async (req, res) => {
  //RECOGER ID DEL USUARIO IDENTIFICADO
  const identify = req.user.id;

  //RECOGER ID DEL USUARIO QUE SIGO Y QUIERO DEJAR DE SEGUIR
  const followedId = req.params.id;

  //FIND DE LAS COINCIDENCIAS Y HACER REMOVE
  try {
    let unfollowed = await Follow.findOneAndDelete({
      user: identify,
      followed: followedId,
    });

    if (!unfollowed) {
      return res.status(500).json({
        //devolver error
        status: "error",
        mensaje: "No se dejo de seguir a nadie",
      });
    }

    return res.status(200).json({
      //devolver error
      status: "success",
      mensaje: "Follow Eliminado Correctamente",
    });
  } catch (error) {
    return res.status(500).json({
      //devolver error
      status: "error",
      mensaje: "Error al dejar de seguir",
    });
  }
};

//ACCION DE LISTAR USUARIOS QUE CUALQUIERE ESTA SIGUIENDO (siguiendo)
const following = async (req, res) => {
  // sacar el id del usuario identificado
  let userId = req.user.id;

  //comprobar si me llega el id por parametro en la url
  if (req.params.id) userId = req.params.id;

  //comprobar si me llega la pagina, si no la pagina 1
  let page = 1;

  if (req.params.page) page = req.params.page;

  //Usuarios por pagina que quiero mostrar
  const itemsPerPage = 5;

  //find a follow, popular datos de los usuarios y paginar con mongoose paginate
  try {
    const follows = await Follow.find({ user: userId })
      .populate("user followed", "-password -role  -__v -email")
      .paginate(page, itemsPerPage);

    let total = await Follow.find({ user: userId });

    if (!follows.length > 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "No se han encontrado followings",
        total: total.length,
        pages: Math.ceil(total.length / itemsPerPage),
      });
    }

    //listado de usuarios de 'juan', y yo soy 'raul'
    //sacar un array de ids de los usuarios que me siguen y los que sigo como raul
    let followUserIds = await  followService.followUserIds(req.user.id);

    //devolver respusta
    return res.status(200).send({
      status: "Success",
      mensaje: "Listado de usuarios que estoy siguiendo",
      follows,
      total: total.length,
      pages: Math.ceil(total.length / itemsPerPage),
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers
    });
  } catch (error) {
    return res.status(400).json({
      status: "Error",
      mensaje: "Error Al buscar usuarios ",
    });
  }
};

//ACCION DE LISTAR USUARIOS QUE SIGUEN A CUALQUIER OTRO USUARIO
//(soy siguido, mis seguidores)
const followers = async (req, res) => {

   // sacar el id del usuario identificado
   let userId = req.user.id;

   //comprobar si me llega el id por parametro en la url
   if (req.params.id) userId = req.params.id;
 
   //comprobar si me llega la pagina, si no la pagina 1
   let page = 1;
 
   if (req.params.page) page = req.params.page;
 
   //Usuarios por pagina que quiero mostrar
   const itemsPerPage = 5;

   //find a follow, popular datos de los usuarios y paginar con mongoose paginate
  try {
    const follows = await Follow.find({ followed: userId })
      .populate("user", "-password -role  -__v -email")
      .paginate(page, itemsPerPage);

    let total = await Follow.find({ user: userId });

    if (!follows.length > 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "No se han encontrado followers",
        total: total.length,
        pages: Math.ceil(total.length / itemsPerPage),
      });
    }


    //sacar un array de ids de los usuarios que me siguen 
    let followUserIds = await  followService.followUserIds(req.user.id);

    //devolver respusta
    return res.status(200).send({
      status: "Success",
      mensaje: "Listado de usuarios que me siguen",
      follows,
      total: total.length,
      pages: Math.ceil(total.length / itemsPerPage),
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers
    });
  } catch (error) {
    return res.status(400).json({
      status: "Error",
      mensaje: "Error Al buscar usuarios ",
    });
  }
};

//EXPORTAR ACCIONES
module.exports = { pruebaFollow, save, unFollow, following, followers };
