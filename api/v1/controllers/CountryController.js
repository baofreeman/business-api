const axios = require("axios");
class CountryController {
  async provinces(req, res, next) {
    try {
      const result = await axios.get("https://vapi.vnappmob.com/api/province");
      res.json(result.data);
    } catch (error) {
      console.log(error);
    }
  }

  async districts(req, res, next) {
    const { provinceId } = req.params;
    try {
      const result = await axios.get(
        `https://vapi.vnappmob.com/api/province/district/${provinceId}`
      );
      res.json(result.data);
    } catch (error) {
      console.log(error);
    }
  }
}
module.exports = new CountryController();
