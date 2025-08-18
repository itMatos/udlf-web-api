import multer from "multer";
import { paths } from "../config/paths";
import fs from "fs";

if (!fs.existsSync(paths.uploads)) {
  fs.mkdirSync(paths.uploads);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, paths.uploads);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
