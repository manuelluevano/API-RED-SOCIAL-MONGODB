// importar modulos
const jwt = require("jwt-simple");
const moment = require("moment");

//importar clave secreta
const libjwt = require("../services/jwt");
const secret = libjwt.secret;

// middleware de autenticacion
exports.auth = (req, res, next) => {
  //comprobar si me llega la cabecera de auth
  if (!req.headers.authorization) {
    return res.status(403).json({
      status: "error",
      mensaje: "La peticion no tiene la cabecera de autenticacion",
    });
  }

  // limpiar el token
  let token = req.headers.authorization.replace(/['"]+g, ''/);

  // decodificar el token
  try {
    let payload = jwt.decode(token, secret);

    // console.log(payload.exp);

    //comprobar expiracion de token
    if (payload.exp <= moment().unix()) {
      return res.status(401).json({
        status: "error",
        mensaje: "Token Expirado",
        error,
      });
    }

    // agregar datos de usuario a request
    req.user = payload;


  } catch (error) {
    return res.status(404).json({
      status: "error",
      mensaje: "Token invalido",
      error,
    });
  }

  // pasar a ejecucion de accion

  next();
};
