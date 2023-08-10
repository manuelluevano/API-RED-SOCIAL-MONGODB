//IMPORTAR DEPENDENCIAS Y MODULOS
const User = require("../models/user");
const bcrypt = require("bcrypt");
const mongoosePagination = require("mongoose-pagination");
const fs = require("fs");
const path = require("path");

//IMPORTAR MODELOS
const Follow = require("../models/follow");
const Publication = require("../models/publication");

//IMPORTAR SERVICIOS
const jwt = require("../services/jwt");
const followService = require("../services/followService");
const { validarRegistro, validarUpdate } = require("../helper/validate");

//Acciones de prueba
const pruebaUser = (req, res) => {
  return res.status(200).send({
    mensaje: "Mensaje enviado desde el controlador user",
    usuario: req.user,
  });
};

const register = async (req, res) => {
  //Recoger  los parametros  por postt a guardar
  let params = req.body;

  //COMPROBAR QUE LLEGUEN BIEN + (VALIDACION)
  try {
    validarRegistro(params);
  } catch (error) {
    return res.status(400).json({
      status: "Error",
      mensaje: "No se ha validado la información",
    });
  }

  //CONTROL DE USUARIOS DUPLICADOS
  let userSearch = await User.find({
    $or: [
      { email: params.email.toLowerCase() },
      { nick: params.nick.toLowerCase() },
    ],
  });

  if (userSearch && userSearch.length >= 1) {
    return res.status(200).send({
      status: "Success",
      message: "El usuario ya existe",
    });
  }

  //CIFRAR LA CONTRASENA
  let newPass = await bcrypt.hash(params.password, 10);

  params.password = newPass;

  //CREAR OBJETO DE USUARIO
  let user_to_save = new User(params);

  //Guardar el articulo en la base de datos
  user_to_save
    .save()
    .then((usuarioGuardado) => {
      return res.status(200).json({
        //Devolver resultado
        status: "success",
        mensaje: "usuario registrado correctamente",
        usuario: usuarioGuardado,
      });
    })
    .catch((error) => {
      return res.status(400).json({
        //devolver error
        status: "error",
        mensaje: "No se ha guardado el usuario: " + error.message,
      });
    });
};

const login = async (req, res) => {
  //RECOGER PARAMETROS
  let params = req.body;

  //REVISAR SI HAY EMAIL Y PASSWORD ENVIADOS
  if (!params.email || !params.password) {
    return res.status(400).json({
      //devolver error
      status: "Error",
      mensaje: "Faltan datos por enviar",
    });
  }

  //BUSCAR USUARIO SI EXISTE EN LA BASE DE DATOS //        con .select ocultamos la password del usuario
  const userSearch = await User.findOne({ email: params.email.toLowerCase() });
  // .select({"password": 0})

  if (!userSearch) {
    return res.status(400).json({
      status: "error",
      mensaje: "Email no encontrado",
    });
  }

  //COMPROBAR SU CONTRASEBA
  const pwd = bcrypt.compareSync(params.password, userSearch.password);

  if (!pwd) {
    return res.status(400).json({
      status: "error",
      mensaje: "No te has identificado correctamente",
    });
  }

  //CONSEGUIR EL TOKEN
  const token = jwt.createToken(userSearch);

  //DEVOLVER TOKEN

  //ELIMINAR PASSWORD DEL OBJETO

  //DEVOLVER DATOS DEL USUARIO
  return res.status(200).json({
    //devolver error
    status: "Success",
    mensaje: "Te Has Identificado Correctamente",
    userSearch: {
      id: userSearch._id,
      name: userSearch.name,
      nick: userSearch.nick,
    },
    token,
  });
};

const profile = async (req, res) => {
  //RECIBIR EL PARAMETRO DEL ID DEL USUARIO POR URL
  const id = req.params.id;

  try {
    // CONSULTA PARA SACAR LOS DATOS DEL USUARIO
    const userprofile = await User.findById(id).select({
      password: 0,
      role: 0,
    });

    //INFO DE SEGUIMIENTO
    const followInfo = await followService.followThisUser(req.user.id, id);

    //MOSTRAR EL USUARIO
    //POSTERIORMENTE DEVOLVER INFORMACION DE FOLLOWS
    // console.log(followInfo);
    return res.status(200).send({
      status: "Success",
      userprofile,
      following: followInfo.following,
      follower: followInfo.follower,
    });
  } catch (error) {
    return res.status(404).json({
      status: "error",
      mensaje: "Usuario no encontrado",
    });
  }
};

const list = async (req, res) => {
  //controlar en que pagina estamos
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  //convertir a entero 'page'
  page = parseInt(page);

  //consulta con mongoose paginate
  let itemsPerPage = 5;

  try {
    // obtener todos los usuarios
    let listUsers = await User.find({})
      .select("-password -email -role -__v")
      .sort("_id")
      .paginate(page, itemsPerPage);

    let total = await User.find({});

    // console.log("Total usuarios", total.length);

    if (!listUsers.length > 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "No se han encontrado usuarios",
      });
    }

    //listado de usuarios de 'juan', y yo soy 'raul'
    //sacar un array de ids de los usuarios que me siguen y los que sigo como raul
    let followUserIds = await followService.followUserIds(req.user.id);

    return res.status(200).send({
      status: "Success",
      listUsers,
      page,
      itemsPerPage,
      total: total.length,
      pages: Math.ceil(total.length / itemsPerPage),
      user_following: followUserIds.following,
      user_follow_me: followUserIds.followers,
    });
  } catch (error) {
    return res.status(400).json({
      status: "Error",
      mensaje: "Error Al buscar usuarios ",
    });
  }

  //devolver el resultado (posteriormente del follow)
};

const update = async (req, res) => {
  //RECOGER INFO DEL USER A ACTUALIZAR
  let userIdentify = req.user;
  let userToUpdate = req.body;

  //Eliminar campos sobrantes
  delete userToUpdate.iat;
  delete userToUpdate.exp;
  delete userToUpdate.role;
  delete userToUpdate.imagen;

  //VALIDAR DATOS
  try {
    validarUpdate(userToUpdate);
  } catch (error) {
    return res.status(400).json({
      status: "Error",
      mensaje: "Faltan datos para enviar",
    });
  }

  //COMPROBAR SI EXISTE EL USUARIO | DEBE COINCIDIR EMAIL Y NICK
  let userSearch = await User.find({
    $or: [
      { nick: userToUpdate.nick.toLowerCase() },
      { email: userToUpdate.email.toLowerCase() },
    ],
  });

  let userIsset = false;

  //BUSCAR SI EXISTE EN LA BASE DE DATOS EL USUARIO INGRESASO (email Y nick)
  userSearch.forEach((user) => {
    if (user && user._id != userIdentify.id) userIsset = true;
  });

  if (userIsset) {
    return res.status(200).send({
      status: "Success",
      message: "El usuario ya existe",
      userIsset,
      userToUpdate,
    });
  }

  //CIFRAR LA NUEVA CONTRASENA
  if (userToUpdate.password) {
    let newPass = await bcrypt.hash(userToUpdate.password, 10);

    userToUpdate.password = newPass;
  } else {
    //SI NO ENVIAS PASSWORD - REMOVER CAMPO PARA NO ENVIARLO VACIO
    delete userToUpdate.password;
  }

  //BUSCAR Y ACTUALIZAR INFORMACION DE USUARIO
  try {
    let UserActualizado = await User.findByIdAndUpdate(
      {
        _id: userIdentify.id,
      },
      userToUpdate,
      { new: true }
    );

    if (!UserActualizado) {
      return res.status(500).json({
        status: "Error",
        mensaje: "Error al actualziar",
      });
    }

    //MOSTRAR EL USUARIO
    return res.status(200).json({
      status: "Success",
      message: "Usuario Actualizado Correctamente",
      user: UserActualizado,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "Error",
      mensaje: "Error en la consulta",
      error,
    });
  }
};

const upload = async (req, res) => {
  //RECOGER EL FICHERO DE IMAGEN Y COMPROBAR QUE EXISTE
  if (!req.file) {
    return res.status(404).json({
      status: "error",
      mensaje: "Peticion no incluye la imagen",
    });
  }

  //CONSEGUIR EL NOMBRE DEL ARCHIVO
  let imagenName = req.file.originalname;

  //SACAR LA EXTENCION DEL ARCHIVO
  const imageSplit = imagenName.split(".");
  const extencion = imageSplit[1];

  //COMPROBAR LA EXTENCION
  if (
    extencion != "jpg" &&
    extencion != "png" &&
    extencion != "jpeg" &&
    extencion != "gif"
  ) {
    //SI LA EXTENCION ES DISTINTA A LAS INDICADAS, BUSCAR Y ELIMINAR ARCHIVO
    const filePath = req.file.path;

    const fileDelete = fs.unlinkSync(filePath);

    return res.status(400).json({
      status: "error",
      mensaje: "Extencion del fichero invalida",
    });
  }

  //SI ES CORRECTA, GUARDAR IMAGEN EN BD
  try {
    let imageUpload = await User.findOneAndUpdate(
      { _id: req.user.id },
      { imagen: req.file.filename },
      {
        new: true,
      }
    );

    if (!imageUpload) {
      return res.status(500).json({
        status: "Error",
        mensaje: "Error en la subida de avatar",
      });
    }

    //DEVOLVER RESPUESTA
    return res.status(200).json({
      status: "Success",
      user: imageUpload,
      file: req.file,
    });
  } catch (error) {
    // console.log(error);
    return res.status(400).json({
      status: "Error",
      mensaje: "Faltan datos para enviar",
    });
  }
};

const avatar = async (req, res) => {
  //SACAR EL PARAMETRO DE LA URL
  let file = req.params.file;

  //MONTAR EL PATH REAL DE LA IMAGEN
  let filePath = "./uploads/avatars/" + file;

  //COMPROBAR QUE EXISTE
  fs.stat(filePath, (error, exists) => {
    if (!exists) {
      return res.status(404).json({
        status: "Error",
        mensaje: "La imagen no existe",
        exists,
      });
    }

    //DEVOLVER EL FILE
    return res.sendFile(path.resolve(filePath));
  });
};

const counters = async (req, res) => {
  let userId = req.user.id;

  if (req.params.id) {
    userId = req.params.id;
  }

  try {
    const following = await Follow.count({ user: userId });
    const followed = await Follow.count({ followed: userId });

    const publications = await Publication.count({ user: userId });

    return res.status(200).send({
      userId,
      following: following,
      followed: followed,
      publications: publications,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      mensaje: "Error en los controladores",
      error,
    });
  }
};

//EXPORTAR ACCIONES
module.exports = {
  pruebaUser,
  register,
  login,
  profile,
  list,
  update,
  upload,
  avatar,
  counters,
};
