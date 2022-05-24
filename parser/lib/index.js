"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cli = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const arg_1 = __importDefault(require("arg"));
const sass_1 = require("sass");
const glob_1 = __importDefault(require("glob"));
const ora_1 = __importDefault(require("ora"));
const canvas_1 = require("canvas");
// Converts raw arguments into js object
const parseArguments = (rawArgs) => {
    const args = arg_1.default({
        '--help': Boolean,
        // FIXME: name comes with the file
        //'--name': String,
        '--rows': Number,
        '--cols': Number,
        '--input-folder': String,
        '--output-folder': String,
        '--css': String,
        '--img': String,
        '--json': String,
        '--verbose': Boolean,
        '-n': '--name',
        '-r': '--rows',
        '-c': '--cols',
        '-o': '--output-folder',
        '-f': '--input-folder',
        '-v': '--verbose',
    }, {
        argv: rawArgs.slice(2),
    });
    return {
        //TODO: add help
        help: args['--help'] || false,
        //FIXME: random names?
        //name: args['--name'] || `${nanoid(10)}`,
        rows: args['--rows'] || 56,
        cols: args['--cols'] || 56,
        output: args['--output-folder'] || '',
        cssOutputFolder: args['--css'] || '',
        imgOutputFolder: args['--img'] || '',
        jsonOutputFolder: args['--json'] || '',
        inputFolder: args['--input-folder'] || './',
        verbose: args['--verbose'] || false,
    };
};
exports.cli = (args) => __awaiter(void 0, void 0, void 0, function* () {
    let options = resolvePaths(parseArguments(args));
    const structure = [];
    const spinner = ora_1.default({ text: '', spinner: 'simpleDotsScrolling' });
    // generate css skeleton
    yield generateCssSkeleton(options.cssPath || options.output);
    const images = glob_1.default.sync(`${options.inputFolder}/**/*.+(png|jpg)`, {
        ignore: '**/node_modules/**.*',
    });
    if (!images.length) {
        // TODO: Exception?
    }
    for (const image of images) {
        const process = new ProcessImage(Object.assign(Object.assign({}, options), { spinner,
            structure, inputFile: image }));
        yield process.init();
    }
    // Generate json file
    if (options.jsonPath) {
        const jsonFile = path_1.default.join(options.jsonPath, 'filesStructure.js');
        const text = `const filesStructure = ${JSON.stringify(structure, null, '\t')};
    export default filesStructure;`;
        yield fs_extra_1.default.outputFile(jsonFile, text);
    }
});
const resolvePaths = (options) => {
    options.output_path = path_1.default.resolve(options.output);
    options.cssPath = path_1.default.resolve(path_1.default.join(options.output, 'css'));
    options.imgPath = path_1.default.resolve(path_1.default.join(options.output, 'img'));
    options.jsonPath = path_1.default.resolve(options.output);
    if (options.cssOutputFolder !== '') {
        options.cssPath = path_1.default.resolve(options.cssOutputFolder);
    }
    if (options.imgOutputFolder !== '') {
        options.imgPath = path_1.default.resolve(options.imgOutputFolder);
    }
    if (options.jsonOutputFolder !== '') {
        options.jsonPath = path_1.default.resolve(options.jsonOutputFolder);
    }
    //console.log(options);
    return options;
};
const generateCssSkeleton = (folder) => __awaiter(void 0, void 0, void 0, function* () {
    const filePath = path_1.default.resolve('static/scss/pixelator.scss');
    const result = yield sass_1.compileAsync(filePath);
    const output = path_1.default.resolve(`${folder}/pixelator.css`);
    yield fs_extra_1.default.outputFile(output, result.css);
});
class ProcessImage {
    constructor(options) {
        this.map = [];
        this.uniqueColors = ['', '#000000', '#ffffff'];
        this.listColors = [''];
        this.image = new canvas_1.Image();
        this.outputImgFile = '';
        this.outputPath = '';
        this.resolvePaths = () => {
            var _a;
            let paths = ((_a = this.options.inputFile) === null || _a === void 0 ? void 0 : _a.split('/')) || [];
            paths.shift();
            this.outputImgFile = paths[paths.length - 1];
            this.options.name = `${this.outputImgFile.split('.')[0]}`;
            paths.pop();
            this.outputPath = path_1.default.join(...paths);
            /* console.log(this.options);
            console.log(this.outputFile);
            console.log(this.outputPath); */
        };
        this.init = () => __awaiter(this, void 0, void 0, function* () {
            this.spinner.start('Processing...');
            this.spinner.prefixText = `${this.outputPath} - ${this.options.name}: `;
            try {
                //this.spinner.text = 'Loading image';
                const isImageLoaded = yield this.readImage();
                if (!isImageLoaded) {
                    // TODO: Exception ?
                    //this.spinner.text = `An error was occurred while loading : ${this.options.name}`;
                    return;
                }
                //this.spinner.text = 'Generating pixels';
                yield this.process();
                // if verbose
                //const debugFileCreated = await this.createDebugFile();
                //this.spinner.text = 'Generating file';
                //await this.createFileFirstVersion();
                yield this.createFileSecondVersion();
                //this.spinner.text = 'Copying image';
                yield this.copyImage();
                yield this.finish();
                if (!this.options.structure) {
                    return;
                }
                const folderIndex = this.options.structure.findIndex((folder) => folder.name === this.outputPath);
                const itemToPush = {
                    css: path_1.default.join(this.outputPath, `${this.options.name}.css`),
                    name: this.options.name || '',
                    img: path_1.default.join(this.outputPath, this.outputImgFile),
                };
                if (folderIndex > -1) {
                    this.options.structure[folderIndex].files.push(itemToPush);
                }
                else {
                    this.options.structure.push({
                        name: this.outputPath,
                        files: [itemToPush],
                    });
                }
            }
            catch (_a) {
                this.spinner.fail(`An error was occurred with : ${this.options.name}`);
            }
        });
        this.finish = () => __awaiter(this, void 0, void 0, function* () {
            //TODO: cleaner ?
            this.spinner.succeed('Completed');
        });
        this.readImage = () => {
            return new Promise((resolve, reject) => {
                this.image.onload = () => {
                    resolve(true);
                };
                this.image.onerror = () => {
                    reject();
                };
                if (this.options.inputFile) {
                    //image.src = path.resolve(options.input);
                    this.image.src = path_1.default.resolve(this.options.inputFile);
                }
            });
        };
        this.process = () => __awaiter(this, void 0, void 0, function* () {
            this.canvas.width = this.canvas.height =
                this.image.width >= this.options.cols
                    ? this.image.width
                    : this.options.cols;
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fillStyle = '#ffffff';
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.strokeStyle = 'rgba(255,0,0,0.1)';
            const x = (this.canvas.width - this.image.width) / 2;
            let y = 0;
            if (this.canvas.height > this.image.height) {
                y = (this.canvas.height - this.image.height) / 2;
            }
            if (this.options.verbose) {
                const log = [];
                log.push({
                    key: 'Image',
                    width: this.image.width,
                    height: this.image.height,
                });
                log.push({
                    key: 'Canvas',
                    width: this.canvas.width,
                    height: this.canvas.height,
                });
                log.push({
                    key: 'Image offset',
                    x: x,
                    y: y,
                });
                console.table(log);
                console.log('\n\n');
            }
            this.context.drawImage(
            //@ts-ignore
            // FIXME: change Image object for CanvasImageSource
            this.image, x, y, this.image.width, this.image.height);
            const saltoX = this.canvas.width / this.options.rows;
            const saltoY = this.canvas.height / this.options.cols;
            for (let row = 1; row <= this.options.rows; row++) {
                for (let col = 1; col <= this.options.cols; col++) {
                    var pixel = this.context.getImageData(col * saltoX - saltoX / 2, row * saltoY - saltoY / 2, 1, 1);
                    // pixel: data: [r, g, b]
                    var hexColor = this.rgbToHex(pixel);
                    yield this.addColorToList(hexColor);
                }
            }
        });
        this.createDebugFile = () => {
            return new Promise((resolve, reject) => {
                let output = `${this.options.output_path}/${this.options.name}_debug.png`;
                const out = fs_extra_1.default.createWriteStream(output);
                const stream = this.canvas.createPNGStream();
                stream.pipe(out);
                out.on('finish', () => resolve);
                out.on('error', () => reject);
            });
        };
        this.createFileFirstVersion = () => __awaiter(this, void 0, void 0, function* () {
            const textList = ['@import  "../pixelart";\n'];
            textList.push(`$grid: ${this.options.cols};\n`);
            let looper = 0;
            let listColors = ['\n$colors: ('];
            for (let index = 1; index < Object.entries(this.uniqueColors).length; index++) {
                let [number, hexa] = Object.entries(this.uniqueColors)[index];
                textList.push(`$color-${number}: ${hexa};`);
                listColors.push(`\t${number}: $color-${number},`);
            }
            listColors.push(');\n');
            textList.push(...listColors);
            const shadows = ['$pixeledImage:\n'];
            for (let index = 0; index < this.map.length; index++) {
                const item = this.map[index];
                shadows.push(`${item},`);
                looper++;
                if (looper == this.options.cols) {
                    shadows.push('\n');
                    looper = 0;
                }
            }
            const textShadows = shadows.join('').slice(0, -2) + ';\n';
            textList.push(textShadows);
            textList.push('.pixeledImage {');
            textList.push('\t@include pixelart($pixeledImage);');
            textList.push('}');
            let output = this.options.output || `"./${this.options.name}.scss`;
            if (this.options.inputFolder !== '') {
                output = `${output}/${this.options.name}.scss`;
            }
            output = path_1.default.resolve(output);
            yield fs_extra_1.default.promises.writeFile(output, textList.join('\n'));
            return;
        });
        this.createFileSecondVersion = () => __awaiter(this, void 0, void 0, function* () {
            const textList = [];
            let looper = 0;
            textList.push('.pixeledImage {');
            for (let index = 1; index < Object.entries(this.listColors).length; index++) {
                let [number, hexa] = Object.entries(this.listColors)[index];
                textList.push(`\t--pixel-color-${number}: ${hexa};`);
            }
            textList.push('}');
            const fileText = textList.join('\n');
            //let output = `${this.options.output_path}/${this.options.name}.css`;
            let output = path_1.default.join(this.options.cssPath || '', this.outputPath, `${this.options.name}.css`);
            output = path_1.default.resolve(output);
            yield fs_extra_1.default.outputFile(output, fileText);
            return true;
        });
        this.copyImage = () => __awaiter(this, void 0, void 0, function* () {
            if (!this.options.inputFile)
                return;
            const directory = path_1.default.join(this.options.imgPath || '', this.outputPath, this.outputImgFile);
            yield fs_extra_1.default.copy(this.options.inputFile, directory);
        });
        /**
         *
         * @param hexColor
         * @param index
         * @returns
         */
        this.addColorToList = (hexColor) => {
            return new Promise((resolve, reject) => {
                const colorIndex = this.uniqueColors.findIndex((color) => color == hexColor);
                if (colorIndex < 0) {
                    this.uniqueColors.push(hexColor);
                }
                this.listColors.push(hexColor);
                const index = this.uniqueColors.indexOf(hexColor);
                this.map.push(index);
                resolve();
            });
        };
        this.componentToHex = (color) => {
            var hex = color.toString(16);
            return hex.length == 1 ? '0' + hex : hex;
        };
        this.rgbToHex = (pixelRGB) => {
            return ('#' +
                this.componentToHex(pixelRGB.data[0]) +
                this.componentToHex(pixelRGB.data[1]) +
                this.componentToHex(pixelRGB.data[2]));
        };
        this.options = options;
        this.spinner = options.spinner || ora_1.default().start();
        this.canvas = canvas_1.createCanvas(options.cols, options.cols);
        this.context = this.canvas.getContext('2d');
        this.context.imageSmoothingEnabled = false;
        this.resolvePaths();
    }
}
