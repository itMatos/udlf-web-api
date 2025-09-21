"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const express_1 = __importDefault(require("express"));
const port = process.env.PORT || 8080;
app_1.default.use(express_1.default.json());
app_1.default.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
