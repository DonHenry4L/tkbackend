const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
// const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { readdirSync } = require("fs");
const dotenv = require("dotenv");
const { handleNotFound } = require("./utils/helper");
const { errorHandler } = require("./middlewares/error");
dotenv.config();
const app = express();

app.use(bodyParser.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// app.use(
//   fileUpload({
//     useTempFiles: true,
//   })
// );
//routes
readdirSync("./routes").map((r) => app.use("/", require("./routes/" + r)));

app.use("/*", handleNotFound);

app.use(errorHandler);

//database
mongoose
  .connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
  })
  .then(() => console.log("database connected successfully"))
  .catch((err) => console.log("error connecting to mongodb", err));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}..`);
});
