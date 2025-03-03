const createFileWithContent = require('./createFileWithContent');
const getModule = require('./module');
const getService = require('./service');
const getController = require('./controller');

const arg = process.argv?.[2];

if (!arg) {
  console.error('Please provide a name for the module');
  process.exit(1);
}

// if arg have '-' change to camelCase
const argArray = arg.split('-');
argArray.forEach((arg, index) => {
  argArray[index] = arg[0].toUpperCase() + arg.slice(1).toLowerCase();
});
const Name = argArray.join('');
const name = Name[0].toLowerCase() + Name.slice(1);

createFileWithContent(
  `src/apis/${name}/${name}.module.ts`,
  getModule(Name, name),
);
createFileWithContent(
  `src/apis/${name}/${name}.service.ts`,
  getService(Name, name),
);
createFileWithContent(
  `src/apis/${name}/${name}.controller.ts`,
  getController(Name, name, arg),
);
