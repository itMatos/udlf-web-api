"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSpecificLine = readSpecificLine;
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
async function readSpecificLine(filePath, lineNumber) {
    const fileStream = fs_1.default.createReadStream(filePath);
    const rl = readline_1.default.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });
    let currentLine = 0;
    for await (const line of rl) {
        currentLine++;
        if (currentLine === lineNumber + 1) {
            rl.close();
            fileStream.destroy();
            return line;
        }
        // Se a linha for muito grande ou se quiser parar de ler após um certo ponto
        // if (currentLine > lineNumber) {
        //   rl.close();
        //   fileStream.destroy();
        //   return null;
        // }
    }
    return null;
}
