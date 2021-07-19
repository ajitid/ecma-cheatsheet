const fs = require("fs");

const data = fs.readFileSync("readme.mdx", { encoding: "utf8", flag: "r" });

module.exports = data;
