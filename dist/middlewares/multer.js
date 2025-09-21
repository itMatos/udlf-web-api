"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const paths_1 = require("../config/paths");
const fs_1 = __importDefault(require("fs"));
if (!fs_1.default.existsSync(paths_1.paths.uploads)) {
    fs_1.default.mkdirSync(paths_1.paths.uploads);
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, paths_1.paths.uploads);
    },
    filename: (_req, file, cb) => {
        cb(null, file.originalname);
    },
});
exports.upload = (0, multer_1.default)({ storage });
