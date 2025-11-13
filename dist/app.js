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
// Configure CORS to allow requests from Vercel deployment and localhost
const corsOptions = {
    origin: [
        'https://udlf-web.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://front:3000' // Docker internal network
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use("/", execution_routes_1.default);
app.use("/api/directory", directory_routes_1.default);
exports.default = app;
