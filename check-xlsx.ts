import * as XLSX_STAR from 'xlsx';
import XLSX_DEFAULT from 'xlsx';
import { read, utils } from 'xlsx';

console.log("--- XLSX IMPORT CHECK ---");
console.log("import * as XLSX type:", typeof XLSX_STAR);
console.log("XLSX_STAR keys:", Object.keys(XLSX_STAR).slice(0, 5));
console.log("XLSX_STAR.utils:", typeof XLSX_STAR.utils);

console.log("import XLSX_DEFAULT type:", typeof XLSX_DEFAULT);
// console.log("XLSX_DEFAULT keys:", XLSX_DEFAULT ? Object.keys(XLSX_DEFAULT).slice(0, 5) : "null");
console.log("XLSX_DEFAULT.utils:", XLSX_DEFAULT ? typeof XLSX_DEFAULT.utils : "undefined");

console.log("named import read type:", typeof read);
console.log("named import utils type:", typeof utils);
