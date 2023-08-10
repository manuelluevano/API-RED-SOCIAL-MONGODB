//IMPORTAR MODULOS
const fs = require("fs");
const path = require("path");

const { validarPublicacion } = require("../helper/validate");

//IMPORTAR MODELOS
const Publication = require("../models/publication");

//IMPORTAR SERVICIOS
const followServices = require("../services/followService");

//Acciones de prueba
const pruebaPublication = (req, res) => {
  return res.status(200).send({
    mensaje: "Mensaje enviado desde el controlador Publication",
  });
};

//GUARDAR PUBLICACIONES
const save = async (req, res) => {
  //Recoger  los parametros  por postt a guardar
  let params = req.body;

  //COMPROBAR QUE LLEGUEN BIEN + (VALIDACION)
  try {
    validarPublicacion(params);
  } catch (error) {
    return res.status(400).json({
      status: "Error",
      mensaje: "No se ha validado la información",
    });
  }

  //CREAR OBJETO
  let newPublicacion = new Publication(params);
  newPublicacion.user = req.user.id;

  //Guardar el articulo en la base de datos
  newPublicacion
    .save()
    .then((publicationSave) => {
      return res.status(200).json({
        //Devolver resultado
        status: "success",
        mensaje: "Publicacion creada correctamente",
        publication: publicationSave,
      });
    })
    .catch((error) => {
      return res.status(400).json({
        //devolver error
        status: "error",
        mensaje: "No se ha podido crear la publicacion: " + error.message,
      });
    });
};

//SACAR UNA PUBLICACION POR ID

const detail = async (req, res) => {
  let publicationId = req.params.id;

  try {
    // const getPublication = await Publication.findById(publicationId);

    Publication.findById(publicationId).then((getPublication)=>{

    if (!getPublication) {
      return res.status(404).send({
        status: "error",
        mensaje: "No existe la publicacion",
      });
    }

    return res.status(200).send({
      status: "Success",
      publication: getPublication,
    });
  })
  } catch (error) {
    return res.status(500).send({
      status: "error",
      mensaje: "Error en la peticion" + error,
    });
  }
};

//ELIMINAAR PUBLICACIONES

const remove = async (req, res) => {
  let publicationId = req.params.id;

  try {
    //VERIFICAR SI LA PUBLICACION ES DEL USUARIO QUE LA QUIERE ELIMINAR
    const removePublication = await Publication.findOneAndDelete({
      user: req.user.id,
      _id: publicationId,
    });

    if (!removePublication) {
      return res.status(404).send({
        status: "error",
        mensaje: "No existe la publicacion",
      });
    }

    return res.status(200).send({
      status: "Success",
      mensaje: "Publicacion Eliminada Correctamente",
      publication: removePublication,
    });
  } catch (error) {
    return res.status(500).send({
      status: "error",
      mensaje: "Error en la peticion" + error,
    });
  }
};

//LISTAR PUBLICACIONES DE UN USUARIO EN CONCRETO
const user = async (req, res) => {
  //SACAR ID DE USUARIO
  let userId = req.params.id;
  //CONTROLAR LA PAGINA
  let page = 1;

  if (req.params.page) page = req.params.page;

  const itemsPerPage = 5;

  //FIND, POPULATE, ORDENAR, PAGINAR
  try {
    const getPublication = await Publication.find({ user: userId })
      .sort("-created_at")
      .populate("user", "-password -__v -role -email")
      .paginate(page, itemsPerPage)

    let total = await Publication.find({ user: userId });

    if (getPublication.length <= 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "No se han encontrado publicaciones",
        page,
        pages: Math.ceil(total.length / itemsPerPage),
        total: total.length,
        getPublication,
      });
    }

    return res.status(200).send({
      status: "success",
      mensaje: "Publicaciones del perfil de usuario",
      page,
      pages: Math.ceil(total.length / itemsPerPage),
      total: total.length,
      getPublication,
    });
  } catch (error) {
    return res.status(404).send({
      status: "error",
      mensaje: "Error al buscar publicaciones o usuario incorrecto" + error,
    });
  }
};

//SUBIR FICHEROS - IMAGEN DE PUBLICACION
const upload = async (req, res) => {
  //SACAR PUBLICATION ID
  const publicationId = req.params.id;

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
    let imageUpload = await Publication.findOneAndUpdate(
      { user: req.user.id, _id: publicationId },
      { file: req.file.filename },
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
      publication: imageUpload,
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

//DEVOLVER ARCHIVOS MULTIMEDIA (IMAGENES)
const media = async (req, res) => {
  //SACAR EL PARAMETRO DE LA URL
  let file = req.params.file;

  //MONTAR EL PATH REAL DE LA IMAGEN
  let filePath = "./uploads/publications/" + file;

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

//ACTUALIZAR PUBLICACION

//LISTAR TODAS LAS PUBLICACIONES
const feed = async (req, res) => {
  //SACAR LA PAGINA ACTUAL
  let page = 1;
  if (req.params.page) page = req.params.page;

  //ESTABLECER EL NUMERO DE ELEMENTOS POR PAGINA
  let itemsPerPage = 5;

  //SACAR UN ARRAY DE IDENTIFICADORES DE USUARIOS QUE YO SIGO COMO USUARIO IDENTIFICADO
  try {
    let myFollows = await followServices.followUserIds(req.user.id);

    //FIND A PUBLICACIONES OPERADOR in, ordenar, popular, paginar
    const publications = await Publication.find({ user: myFollows.following })
      .populate("user", "-password -role -__v -email")
      .sort("-created_at")
      .paginate(page, itemsPerPage)

      let total = await Publication.find({ user: myFollows.following });

    if (!Publication.length > 0) {
      return res.status(404).json({
        status: "error",
        mensaje: "No se han encontrado publicaciones",
      });
    }

      return res.status(200).send({
        status: "success",
        mensaje: "feed de publicaciones",
        total: total.length,
        page,
        pages: Math.ceil(total.length / itemsPerPage),
        publications,
      });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      mensaje: "No se han listado las publicaciones del feed",
    });
  }
};

//EXPORTAR ACCIONES
module.exports = {
  pruebaPublication,
  save,
  detail,
  remove,
  user,
  upload,
  media,
  feed,
};
