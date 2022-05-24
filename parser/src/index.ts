import fs from 'fs-extra';
import path from 'path';
import arg from 'arg';
import { compileAsync } from 'sass';
import glob from 'glob';

import ora from 'ora';
import { Canvas, createCanvas, Image } from 'canvas';
import { nanoid } from 'nanoid';

type FolderType = {
  name: string;
  files: FileType[];
};

type FileType = {
  name: string;
  img: string;
  css: string;
};

type ParseImageOptions = {
  help?: boolean;
  name?: string;
  rows: number;
  cols: number;
  output: string;
  cssOutputFolder: string;
  imgOutputFolder: string;
  jsonOutputFolder: string;
  inputFolder: string;
  inputFile?: string;
  verbose?: boolean;
  output_path?: string;
  cssPath?: string;
  imgPath?: string;
  jsonPath?: string;
  spinner?: ora.Ora;
  structure?: FolderType[];
};

// Converts raw arguments into js object
const parseArguments = (rawArgs: string[]) => {
  const args = arg(
    {
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
    },
    {
      argv: rawArgs.slice(2),
    }
  );

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
    //input: args._[0] || undefined,
  };
};

export const cli = async (args: string[]) => {
  let options = resolvePaths(parseArguments(args));
  const structure: FolderType[] = [];

  const spinner = ora({ text: '', spinner: 'simpleDotsScrolling' });

  // generate css skeleton
  await generateCssSkeleton(options.cssPath || options.output);

  const images = glob.sync(`${options.inputFolder}/**/*.+(png|jpg)`, {
    ignore: '**/node_modules/**.*',
  });

  if (!images.length) {
    // TODO: Exception?
  }

  for (const image of images) {
    const process = new ProcessImage({
      ...options,
      spinner,
      structure,
      inputFile: image,
    });

    await process.init();
  }

  // Generate json file
  if (options.jsonPath) {
    const jsonFile = path.join(options.jsonPath, 'filesStructure.js');

    const text = `const filesStructure = ${JSON.stringify(
      structure,
      null,
      '\t'
    )};
    export default filesStructure;`;

    await fs.outputFile(jsonFile, text);
  }
};

const resolvePaths = (options: ParseImageOptions): ParseImageOptions => {
  options.output_path = path.resolve(options.output);

  options.cssPath = path.resolve(path.join(options.output, 'css'));
  options.imgPath = path.resolve(path.join(options.output, 'img'));
  options.jsonPath = path.resolve(options.output);

  if (options.cssOutputFolder !== '') {
    options.cssPath = path.resolve(options.cssOutputFolder);
  }

  if (options.imgOutputFolder !== '') {
    options.imgPath = path.resolve(options.imgOutputFolder);
  }

  if (options.jsonOutputFolder !== '') {
    options.jsonPath = path.resolve(options.jsonOutputFolder);
  }

  //console.log(options);

  return options;
};

const generateCssSkeleton = async (folder: string): Promise<void> => {
  const filePath = path.resolve('static/scss/pixelator.scss');
  const result = await compileAsync(filePath);
  const output = path.resolve(`${folder}/pixelator.css`);

  await fs.outputFile(output, result.css);
};

class ProcessImage {
  private canvas: Canvas;
  private context: CanvasRenderingContext2D;
  private options: ParseImageOptions;
  private map: number[] = [];
  private uniqueColors = ['', '#000000', '#ffffff'];
  private listColors: string[] = [''];
  private spinner: ora.Ora;
  private image: Image = new Image();
  private outputImgFile: string = '';
  private outputPath: string = '';

  constructor(options: ParseImageOptions) {
    this.options = options;

    this.spinner = options.spinner || ora().start();

    this.canvas = createCanvas(options.cols, options.cols);
    this.context = this.canvas.getContext('2d');
    this.context.imageSmoothingEnabled = false;

    this.resolvePaths();
  }

  public resolvePaths = () => {
    let paths = this.options.inputFile?.split('/') || [];
    paths.shift();

    this.outputImgFile = paths[paths.length - 1];
    this.options.name = `${this.outputImgFile.split('.')[0]}`;

    paths.pop();
    this.outputPath = path.join(...paths);

    /* console.log(this.options);
    console.log(this.outputFile);
    console.log(this.outputPath); */
  };

  public init = async (): Promise<void> => {
    this.spinner.start('Processing...');
    this.spinner.prefixText = `${this.outputPath} - ${this.options.name}: `;

    try {
      //this.spinner.text = 'Loading image';
      const isImageLoaded: boolean = await this.readImage();

      if (!isImageLoaded) {
        // TODO: Exception ?
        //this.spinner.text = `An error was occurred while loading : ${this.options.name}`;
        return;
      }

      //this.spinner.text = 'Generating pixels';
      await this.process();

      // if verbose
      //const debugFileCreated = await this.createDebugFile();

      //this.spinner.text = 'Generating file';
      //await this.createFileFirstVersion();
      await this.createFileSecondVersion();

      //this.spinner.text = 'Copying image';
      await this.copyImage();

      await this.finish();

      if (!this.options.structure) {
        return;
      }

      const folderIndex = this.options.structure.findIndex(
        (folder) => folder.name === this.outputPath
      );

      const itemToPush = {
        css: path.join(this.outputPath, `${this.options.name}.css`),
        name: this.options.name || '',
        img: path.join(this.outputPath, this.outputImgFile),
      };

      if (folderIndex > -1) {
        this.options.structure[folderIndex].files.push(itemToPush);
      } else {
        this.options.structure.push({
          name: this.outputPath,
          files: [itemToPush],
        });
      }
    } catch {
      this.spinner.fail(`An error was occurred with : ${this.options.name}`);
    }
  };

  private finish = async (): Promise<void> => {
    //TODO: cleaner ?

    this.spinner.succeed('Completed');
  };

  private readImage = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      this.image.onload = () => {
        resolve(true);
      };

      this.image.onerror = () => {
        reject();
      };

      if (this.options.inputFile) {
        //image.src = path.resolve(options.input);
        this.image.src = path.resolve(this.options.inputFile);
      }
    });
  };

  private process = async (): Promise<void> => {
    this.canvas.width = this.canvas.height =
      this.image.width >= this.options.cols
        ? this.image.width
        : this.options.cols;

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.fillStyle = '#ffffff';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.strokeStyle = 'rgba(255,0,0,0.1)';

    const x: number = (this.canvas.width - this.image.width) / 2;
    let y: number = 0;
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
      this.image,
      x,
      y,
      this.image.width,
      this.image.height
    );

    const saltoX = this.canvas.width / this.options.rows;
    const saltoY = this.canvas.height / this.options.cols;

    for (let row = 1; row <= this.options.rows; row++) {
      for (let col = 1; col <= this.options.cols; col++) {
        var pixel = this.context.getImageData(
          col * saltoX - saltoX / 2,
          row * saltoY - saltoY / 2,
          1,
          1
        );

        // pixel: data: [r, g, b]
        var hexColor = this.rgbToHex(pixel);

        await this.addColorToList(hexColor);
      }
    }
  };

  private createDebugFile = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      let output = `${this.options.output_path}/${this.options.name}_debug.png`;

      const out = fs.createWriteStream(output);
      const stream = this.canvas.createPNGStream();
      stream.pipe(out);

      out.on('finish', () => resolve);
      out.on('error', () => reject);
    });
  };

  private createFileFirstVersion = async (): Promise<void> => {
    const textList = ['@import  "../pixelart";\n'];
    textList.push(`$grid: ${this.options.cols};\n`);
    let looper = 0;

    let listColors = ['\n$colors: ('];

    for (
      let index = 1;
      index < Object.entries(this.uniqueColors).length;
      index++
    ) {
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

    output = path.resolve(output);

    await fs.promises.writeFile(output, textList.join('\n'));

    return;
  };

  private createFileSecondVersion = async (): Promise<boolean> => {
    const textList = [];
    let looper = 0;

    textList.push('.pixeledImage {');

    for (
      let index = 1;
      index < Object.entries(this.listColors).length;
      index++
    ) {
      let [number, hexa] = Object.entries(this.listColors)[index];
      textList.push(`\t--pixel-color-${number}: ${hexa};`);
    }

    textList.push('}');

    const fileText = textList.join('\n');

    //let output = `${this.options.output_path}/${this.options.name}.css`;

    let output = path.join(
      this.options.cssPath || '',
      this.outputPath,
      `${this.options.name}.css`
    );

    output = path.resolve(output);
    await fs.outputFile(output, fileText);

    return true;
  };

  private copyImage = async (): Promise<void> => {
    if (!this.options.inputFile) return;
    const directory = path.join(
      this.options.imgPath || '',
      this.outputPath,
      this.outputImgFile
    );

    await fs.copy(this.options.inputFile, directory);
  };

  /**
   *
   * @param hexColor
   * @param index
   * @returns
   */
  private addColorToList = (hexColor: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const colorIndex = this.uniqueColors.findIndex(
        (color: string) => color == hexColor
      );

      if (colorIndex < 0) {
        this.uniqueColors.push(hexColor);
      }

      this.listColors.push(hexColor);

      const index = this.uniqueColors.indexOf(hexColor);

      this.map.push(index);

      resolve();
    });
  };

  private componentToHex = (color: number): string => {
    var hex = color.toString(16);
    return hex.length == 1 ? '0' + hex : hex;
  };

  private rgbToHex = (pixelRGB: ImageData): string => {
    return (
      '#' +
      this.componentToHex(pixelRGB.data[0]) +
      this.componentToHex(pixelRGB.data[1]) +
      this.componentToHex(pixelRGB.data[2])
    );
  };
}
