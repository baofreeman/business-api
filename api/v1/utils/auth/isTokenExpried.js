const jwt = require("jsonwebtoken");
const isTokenExpire = (token) => {
  if (!token) {
    return true;
  }
  const decodedToken = jwt.decode(token);
  console.log("decode", decodedToken);
  const currentTime = Date.now() / 1000;
  return decodedToken.exp < currentTime;
};

module.exports = { isTokenExpire };
