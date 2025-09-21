"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const execution_routes_1 = __importDefault(require("./routes/execution.routes"));
const directory_routes_1 = __importDefault(require("./routes/directory.routes"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use("/", execution_routes_1.default);
app.use("/api/directory", directory_routes_1.default);
exports.default = app;
