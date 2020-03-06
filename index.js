const fs = require("fs");
// 除掉打包使用的公共包
const NODE_MODULES = "/node_modules/";
// 测试文件和 markdown 文件
const TEST_FILE = /(\/__tests?__\/(__snapshots__\/)?.+\.(test|spec)\.jsx?(\.snap)?$)|(\.md$)|(\.test\.jsx?)/;
// 获取绝对路径
const ABS_PATH = process.cwd();
// 用 Set 是因为文件目录不会重名
let allFileSet = new Set();
let dependFileSet = new Set();
let uselessFileSet = new Set();

// 递归读取文件目录
function readDirSync(path) {
  const pa = fs.readdirSync(path);
  pa.forEach(ele => {
    const abFileName = `${path}/${ele}`;
    const info = fs.statSync(abFileName);
    if (info.isDirectory()) {
      readDirSync(abFileName);
    } else {
      if (!TEST_FILE.test(abFileName)) {
        allFileSet.add(abFileName);
      }
    }
  });
}

class FindUselessFilesPlugin {
  constructor(options) {
    Object.assign(this, { path: "/public_v2" }, options);
  }
  apply(compiler) {
    compiler.hooks.done.tap("FindUselessFilesPlugin", stats => {
      readDirSync(`${ABS_PATH}${this.path}`);

      for (let name of stats.compilation.fileDependencies) {
        if (!name.includes(NODE_MODULES)) {
          dependFileSet.add(name);
        }
      }

      for (let file of allFileSet) {
        if (!dependFileSet.has(file)) {
          uselessFileSet.add(file);
        }
      }

      console.log(
        "[FindUselessFilesPlugin] Useless files number: ",
        uselessFileSet.size
      );
      console.log("[FindUselessFilesPlugin] Useless files: ", uselessFileSet);
    });
  }
}

module.exports = FindUselessFilesPlugin;
