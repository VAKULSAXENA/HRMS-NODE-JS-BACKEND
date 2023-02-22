import type { RequestHandler, Request, Response, NextFunction } from "express";
import { config } from "dotenv";
import jwt from "jsonwebtoken";
import Employee from "../models/employee";
config();
const secret: string = process.env.ACCESS_TOKEN_SECRET || "secret";

const getUserFromCookie = async (user: string) => {
  try {
    const data = jwt.verify(user, secret);
    const { _id }: any = data;
    if (!data) return null;
    const userData = await Employee.findOne({ _id });
    if (userData) {
      // userData.password = ""
      return userData;
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
};

const isAuthenticated: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.cookies;
    if (!user) {
      return res.status(403).json({ status: "403", log: "Please login!" });
    }
    const userData = await getUserFromCookie(user);
    if (userData) {
      res.locals.user = userData;

      return next();
    } else {
      return res.status(403).json({ status: "403", log: "Please login!" });
    }
  } catch (e) {
    // console.error(e);
    return res
      .status(500)
      .json({ status: "500", log: "Server error, try again later!" });
  }
};

const privateRoute: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.cookies;
    const key = req.query.id;
    if (!user) {
      return res.status(403).json({ status: "403", log: "Please login!" });
    }
    const userData: any = await getUserFromCookie(user);
    const val:any=await Employee.findById(userData._id).find({"documents.s3_url":key})
    if (
      userData.role === "HR" ||
       val.length>0
    ) {
      return next();
    } else {
      return res.status(404).json({ status: "404", log: "Unauthorized request!" });
    }
  } catch (e) {
    // console.error(e);
    return res
      .status(500)
      .json({ status: "500", log: "Server error, try again later!" });
  }
};

const isAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.cookies;
    const { _id } = req.params;
    if (!user) {
      return res.status(403).json({ status: "403", log: "Please login!" });
    }
    const userData: any = await getUserFromCookie(user);

    if (
      userData.role === "HR" ||
      userData.role === "TL" ||
      userData._id.toString() === _id
    ) {
      return next();
    } else {
      return res.status(404).json({ status: "404", log: "Role must be admin!" });
    }
  } catch (e) {
    // console.error(e);
    return res
      .status(500)
      .json({ status: "500", log: "Server error, try again later!" });
  }
};

const isVerified: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { user } = req.cookies;
    if (!user) {
      return res.status(403).json({ status: "403", log: "Please login!" });
    }
    const userData: any = await getUserFromCookie(user);
    if (userData?.verified === true) {
      return next();
    } else {
      return res.status(404).json({ status: "404", log: "user not verified" });
    }
  } catch (e) {
    // console.error(e);
    return res
      .status(500)
      .json({ status: "500", log: "Server error, try again later!" });
  }
};

export { isAuthenticated, isAdmin,privateRoute };
