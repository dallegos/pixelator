import fs from "fs";
import path from "path";
import arg from "arg";
import { nanoid } from "nanoid";
import { createCanvas, Image } from "canvas";
import { pokemonList } from "../pokemonList";

// Utils
const componentToHex = (c) => {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r, g, b) => {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

class ParseImage {
  canvas;
  context;

  // global configuration
  options = {};

  // map of pixels
  map = [];

  // default colors
  colors = {
    "#000000": 1,
    "#ffffff": 2,
  };

  // grid for slicing the image
  grid = {
    cols: 56,
    rows: 56,
  };

  constructor(options) {
    this.options = options;
    this.grid.rows = this.options.rows;
    this.grid.cols = this.options.cols;

    if (options.verbose) console.log("New image founded: ", options.name);

    const image = new Image();

    image.onload = () => {
      this.canvas = createCanvas(
        image.width >= options.cols ? image.width : options.cols,
        image.width >= options.cols ? image.width : options.cols
      );
      this.context = this.canvas.getContext("2d");
      this.context.imageSmoothingEnabled = false;

      this.processImage(image);
    };

    image.onerror = (e) => {
      throw new Error("no se pudo cargar la imagen");
    };

    image.src = path.resolve(options.input);
  }

  processImage = (image) => {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.map.length = 0;

    this.context.fillStyle = "#ffffff";
    this.context.fillRect(0, 0, this.canvas.width + 2, this.canvas.height + 2);
    //this.context.strokeStyle = "rgba(255,0,0,0.1)";

    const x = Number.parseFloat(
      Number.parseFloat(this.canvas.width - image.width) / 2
    );
    const y = Number.parseFloat(
      Number.parseFloat(this.canvas.height - image.height) / 2
    );

    if (this.options.verbose) {
      const log = [];

      log.push({
        key: "Image",
        width: image.width,
        height: image.height,
      });

      log.push({
        key: "Canvas",
        width: this.canvas.width,
        height: this.canvas.height,
      });

      log.push({
        key: "Image offset",
        x: x,
        y: y,
      });

      console.table(log);
      console.log("\n\n");
    }

    this.context.drawImage(image, x, y, image.width, image.height);

    const saltoX = this.canvas.width / this.grid.rows;
    const saltoY = this.canvas.height / this.grid.cols;

    for (let row = 1; row <= this.grid.rows; row++) {
      for (let col = 1; col <= this.grid.cols; col++) {
        var pixel = this.context.getImageData(
          col * saltoX - saltoX / 2,
          row * saltoY - saltoY / 2,
          1,
          1
        );
        var hexColor = rgbToHex(pixel.data[0], pixel.data[1], pixel.data[2]);

        /* this.context.beginPath();
        this.context.arc(
          col * saltoX,
          row * saltoY,
          0.5,
          0,
          2 * Math.PI,
          false
        );
        this.context.stroke(); */

        this.addColorToList(hexColor);
      }
    }

    //console.log('<img src="' + this.canvas.toDataURL() + '" />');

    setTimeout(() => {
      this.createFile();
    }, 1000);
  };

  createFile = () => {
    const textList = ['@import  "../pixelart";\n'];
    textList.push(`$grid: ${this.grid.cols};\n`);
    let looper = 0;

    let listColors = ["\n$colors: ("];

    for (let index = 0; index < Object.entries(this.colors).length; index++) {
      const [hexa, number] = Object.entries(this.colors)[index];

      textList.push(`$color-${number}: ${hexa};`);
      listColors.push(`\t${number}: $color-${number},`);
    }

    listColors.push(");\n");
    textList.push(...listColors);

    const shadows = ["$pixeledImage:\n"];
    for (let index = 0; index < this.map.length; index++) {
      const item = this.map[index];

      shadows.push(`${item},`);
      looper++;

      if (looper == this.grid.cols) {
        shadows.push("\n");
        looper = 0;
      }
    }

    const textShadows = shadows.join("").slice(0, -2) + ";\n";
    textList.push(textShadows);

    textList.push(".pixeledImage {");
    textList.push("\t@include pixelart($pixeledImage);");
    textList.push("}");

    let output = this.options.output || `"./${this.options.name}.scss`;

    if (this.options.folder !== "") {
      output = `${output}/${this.options.name}.scss`;
    }

    output = path.resolve(output);

    fs.writeFile(output, textList.join("\n"), (err) => {
      if (err) throw err;

      if (this.options.verbose) {
        console.log("File created: ", output);
      }
    });
  };

  addColorToList = (hexColor) => {
    if (this.colors[hexColor] === undefined) {
      this.colors[hexColor] =
        this.colors[
          Object.keys(this.colors)[Object.keys(this.colors).length - 1]
        ] + 1;
    }

    this.map.push(this.colors[hexColor]);
  };
}

// Convert raw arguments into js object
const parseArguments = (rawArgs) => {
  const args = arg(
    {
      "--help": Boolean,
      "--name": String,
      "--rows": Number,
      "--cols": Number,
      "--output": String,
      "--folder": String,
      "--verbose": Boolean,

      "-n": "--name",
      "-r": "--rows",
      "-c": "--cols",
      "-o": "--output",
      "-f": "--folder",
      "-v": "--verbose",
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  return {
    help: args["--help"] || false,
    name: args["--name"] || `pokemon-${nanoid(10)}`,
    rows: args["--rows"] || 56,
    cols: args["--cols"] || 56,
    output: args["--output"] || "",
    folder: args["--folder"] || "",
    verbose: args["--verbose"] || false,
    input: args._[0] || undefined,
  };
};

// main function
export const cli = (args) => {
  const options = parseArguments(args);

  if (options.input !== undefined) {
    const parser = new ParseImage(options);
  } else if (options.folder !== "") {
    fs.readdir(options.folder, (err, files) => {
      if (err) {
        return console.log("Unable to scan directory: " + err);
      }

      const imageFiles = files.filter((file) => {
        return (
          path.extname(file).toLowerCase() === ".png" ||
          path.extname(file).toLowerCase() === ".jpg"
        );
      });

      imageFiles.forEach(function (image) {
        let name = `${image.split(".")[0]}`;

        // Renombramiento en masa en base a un listado ordenado
        /* let newName = pokemonList[name - 1];
        fs.rename(
          `${options.folder}/${name}.png`,
          `${options.folder}/${newName}.png`,
          (err) => {
            if (err) console.log("ERROR: " + err);
          }
        ); */

        new ParseImage({
          ...options,
          name,
          input: `${options.folder}/${image}`,
        });
      });
    });
  }
};
