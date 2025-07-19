const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { ServerApiVersion } = require("mongodb");
const { notFoundHandler, errorHandler } = require("./middleWares/common/errorHandler");

// initialize environment variables
dotenv.config();

// express app initialization
const app = express();
const port = process.env.PORT || 5000;

// cors setup
app.use(
  cors({
    origin: [
      "http://localhost:3000","https://courierly.web.app","https://courierly.firebaseapp.com"
    ],
    credentials: true,
    exposedHeaders: ["Set-Cookie", "Date", "ETag"],
  })
);

// request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cookie parser
app.use(cookieParser(process.env.COOKIE_SECRET));

/*------------ Database Connection ------------*/
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASSWORD}@cluster0.yl3rkqk.mongodb.net/${process.env.APP_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
    family: 4,
  })
  .then(() => console.log("Database connection successful"))
  .catch((error) => console.error("Database connection failed:", error));

/*------------- Routers -------------*/
const usersRouter = require("./routers/v1/usersRouter");
const loginRouter = require("./routers/v1/loginRouter");
const parcelRouter = require("./routers/v1/parcelRouter");
const agentsRouter = require("./routers/v1/agentsRouter");


app.use("/api/v1/users", usersRouter);
app.use("/api/v1/login", loginRouter);
app.use("/api/v1/parcel", parcelRouter);
app.use("/api/v1/agents", agentsRouter);

/*------------- Error Handling -------------*/
app.use(notFoundHandler);
app.use(errorHandler);

/*------------- Server Start -------------*/
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

/*------------- Optional: Handle unhandled rejections -------------*/
// process.on("unhandledRejection", (error) => {
//   console.error("Unhandled Rejection:", error.name, error.message);
//   process.exit(1);
// });
