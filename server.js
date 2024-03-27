const app = require("./index");
const { configDev } = require("./src/configs/config.mongodb");

const server = app.listen(configDev.app.port || 8080, () => {
  console.log("Backend server is running");
});
