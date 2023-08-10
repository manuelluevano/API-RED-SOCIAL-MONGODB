const Follow = require("../models/follow");

const followUserIds = async (identifyUserId) => {
  try {
    //SACAR INFORMACION DE SEGUIMIENTO
    let following = await Follow.find({ user: identifyUserId }).select({
      followed: 1,
      _id: 0,
    });

    let followers = await Follow.find({ followed: identifyUserId }).select({
      user: 1,
      _id: 0,
    });

    //PROCESAR ARRAY DE IDENTIFICADORES
    let followinClean = [];
    following.forEach((follow) => {
      followinClean.push(follow.followed);
    });

    let followersClean = [];
    followers.forEach((follow) => {
      followersClean.push(follow.user);
    });

    return {
      following: followinClean,
      followers: followersClean,
    };
  } catch (error) {
    return {};
  }
};

//COMPROBAR SI UN USUARIO ME SIGUE O NO DE MANERA INDIVIDUAL
const followThisUser = async (identifyUserId, profileUserId) => {
  try {
    //SACAR INFORMACION DE SEGUIMIENTO
    let following = await Follow.findOne({ user: identifyUserId, "followed": profileUserId })

    let follower = await Follow.findOne({ user: profileUserId, followed: identifyUserId })

    return  {
      following,
      follower
    }


  } catch (error) {
    return {};
  }
};

module.exports = { followUserIds, followThisUser };
