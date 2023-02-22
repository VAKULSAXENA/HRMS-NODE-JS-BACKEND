import express, { Request, Response } from "express";
import API from "./routes/auth";
import RequestApi from "./routes/request";
import documentApi from "./routes/document";
import salaryApi from "./routes/salarySlip";
import helmet from "helmet";
import { config } from "dotenv";
const app = express();
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import morgan from "morgan";
config();
const URL = process.env.URL || " ";
const port = process.env.PORT || 3000;

import cors from "cors";
const corsConfig = {
  credentials: true,
  origin: true,
};

app.use(cors(corsConfig));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use("/api", API);
app.use("/api", RequestApi);
app.use("/api", documentApi);
app.use("/api", salaryApi);

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to HRMS Portal");
});
mongoose.connect(URL, (error: any) => {
  if(error) return console.log(`Unable to connect to the DB: ${error}`)
  console.log("DB Connected");
});

app.listen(port, () => {
  console.log(`Application is running on port ${port}.`);
});
