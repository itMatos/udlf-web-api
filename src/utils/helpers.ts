import fs from "fs";
import readline from "readline";

export async function readSpecificLine(filePath: string, lineNumber: number) {
  const fileStream = fs.createReadStream(filePath);

  const rl = readline.createInterface({
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
