import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { ThesDatabase } from "../src/common/thesDatabase.js";

const database: ThesDatabase = new ThesDatabase();
const files = ["fr.dat", "it.dat", "es.dat", "en.dat", "de.dat"];
const relativePath = "tools";

function buildJsonDat(inputFile: string) {
  let columns, line, syn, _i, _j, _len, _len1, _ref1;
  database.resetAll();
  if (!existsSync(inputFile)) {
    return;
  }
  const input = readFileSync(inputFile, "utf8");
  const current = {
    meanings: 0,
    word: "",
  };

  const _ref = input.split("\n").slice(1);
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    line = _ref[_i];
    columns = line?.split("|");
    if (columns !== undefined) {
      if (current.meanings === 0) {
        current.word = columns[0] !== undefined ? columns[0] : "";
        current.meanings = Number(columns[1]);
        database.resetKey(current.word);
      } else {
        --current.meanings;
        _ref1 = columns.slice(1);
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          syn = _ref1[_j];
          if (syn == null || syn === "") {
            continue;
          }
          syn = syn.trim();
          if (database.hasKeyValuePair(current.word, syn)) {
            continue;
          }
          try {
            database.addItem(current.word, syn);
          } catch (e) {
            console.log("Cannot add word: " + current.word);
            console.log(e);
          }
        }
      }
    }
  }
  console.log(database.items.length);
  // mythes-fr mythes-it mythes-es mythes-de mythes-en-us
  writeFileSync(inputFile + ".json", JSON.stringify(database));
}

console.log("Building JSON dat files");
for (const file of files) {
  console.log("Building: " + file);
  buildJsonDat(relativePath + "/" + file);
}
console.log("Done");
