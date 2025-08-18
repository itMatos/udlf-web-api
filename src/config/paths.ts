import path from "path";
const BASE_PROJECT_PATH = "/Users/italomatos/Documents/IC";

export const paths = {
  uploads: path.join(process.cwd(), "uploads"),
  outputs: path.join(BASE_PROJECT_PATH, "udlf-api/outputs"),
  datasetList: path.join(BASE_PROJECT_PATH, "UDLF/Datasets/mpeg7/lists_mpeg7.txt"),
  datasetImages: path.join(BASE_PROJECT_PATH, "UDLF/Datasets/mpeg7/original/"),
};
