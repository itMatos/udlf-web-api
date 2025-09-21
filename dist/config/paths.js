"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paths = void 0;
const path_1 = __importDefault(require("path"));
// const ROOT_UDLF_PATH = process.env.HOST_UDLF_PATH || "";
const APP_DATASETS_PATH = process.env.APP_DATASETS_PATH || "/app/datasets";
const lists_mpeg7_path = path_1.default.join(APP_DATASETS_PATH, "/mpeg7/lists_mpeg7.txt");
const class_list_path = path_1.default.join(APP_DATASETS_PATH, "/mpeg7/classes_mpeg7.txt");
exports.paths = {
    uploads: path_1.default.join(process.cwd(), "uploads"),
    outputs: path_1.default.join("app/outputs"),
    datasetList: lists_mpeg7_path,
    datasetImages: path_1.default.join(APP_DATASETS_PATH, "/mpeg7/original"),
    classList: class_list_path,
};
