const validator = require("validator");

const validarRegistro = (params) => {
  //VALIDAR DATOS
  // console.log(params);

  let validarName =
    !validator.isEmpty(params.name) &&
    validator.isLength(params.name, { min: 3, max: 15 }) &&
    validator.isAlpha(params.name, "es-ES");

  let validateSurname =
    !validator.isEmpty(params.surname) &&
    validator.isLength(params.surname, { min: 2, max: 15 }) &&
    validator.isAlpha(params.surname, "es-ES");

  let validarNick =
    !validator.isEmpty(params.nick) &&
    validator.isLength(params.nick, { min: 3, max: 15 });

  let validarEmail =
    !validator.isEmpty(params.email) && validator.isEmail(params.email);

  let validarPassword = !validator.isEmpty(params.password);

  if (params.bio) {
    let validateBio =
      !validator.isEmpty(params.bio) &&
      validator.isLength(params.bio, { min: undefined, max: 255 });

    // if (!bio) {
    //   throw new Error("No se ha validado la información de la bios");
    // } else {
    //   console.log("Validacion superada");
    // }
  }

  if (
    !validarName ||
    !validateSurname ||
    !validarNick ||
    !validarEmail ||
    !validarPassword
  ) {
    throw new Error("No se ha validado la información");
  } else {
    console.log("Validacion superada");
  }
};

const validarUpdate = (params) => {
  //VALIDAR DATOS
  console.log(params);
  let validarName =
    !validator.isEmpty(params.name) &&
    validator.isLength(params.name, { min: 5, max: 15 });

  let validarEmail = !validator.isEmpty(params.email);

  let validarNick = !validator.isEmpty(params.nick);

  if (!validarName || !validarEmail || !validarNick) {
    throw new Error("No se ha validado la información");
  }
};

const validarPublicacion = (params) => {
  //VALIDAR DATOS

  let validarTexto =
    !validator.isEmpty(params.text) &&
    validator.isLength(params.text, { min: 5, max: 200 });

  // let validarEmail = !validator.isEmpty(params.email);

  // let validarNick = !validator.isEmpty(params.nick);

  if (!validarTexto) {
    throw new Error("No se ha validado la información");
  }
};

module.exports = {
  validarRegistro,
  validarUpdate,
  validarPublicacion,
};
