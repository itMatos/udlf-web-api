import path from "path";
// const ROOT_UDLF_PATH = process.env.HOST_UDLF_PATH || "";
const APP_DATASETS_PATH = process.env.APP_DATASETS_PATH || "/app/datasets";
const lists_mpeg7_path = path.join(APP_DATASETS_PATH, "/mpeg7/lists_mpeg7.txt");
const class_list_path = path.join(APP_DATASETS_PATH, "/mpeg7/classes_mpeg7.txt");

export const paths = {
  uploads: path.join(process.cwd(), "uploads"),
  outputs: path.join("app/outputs"),
  datasetList: lists_mpeg7_path,
  datasetImages: path.join(APP_DATASETS_PATH, "/mpeg7/original"),
  classList: class_list_path,
};
