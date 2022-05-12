import fs from "fs";
import path from "path";
import arg from "arg";
import { nanoid } from "nanoid";
import { createCanvas, Image } from "canvas";

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
    console.log(options);

    this.options = options;
    this.canvas = createCanvas(1200, 1200);
    this.context = this.canvas.getContext("2d");
    this.context.imageSmoothingEnabled = false;

    const image = new Image();
    image.onload = () => {
      this.processImage(image);
    };

    image.onerror = (e) => {
      throw new Error("no se pudo cargar la imagen");
    };

    console.log("INPUT", path.resolve(options.input));
    image.src = path.resolve(options.input);
  }

  processImage = (image) => {
    this.map.length = 0;

    this.context.scale(10, 10);
    this.context.drawImage(image, 0, 0, image.width, image.height);

    for (let row = 1; row <= this.grid.rows; row++) {
      for (let col = 1; col <= this.grid.cols; col++) {
        var pixel = this.context.getImageData(col * 10 - 5, row * 10 - 5, 1, 1);
        var hexColor = rgbToHex(pixel.data[0], pixel.data[1], pixel.data[2]);

        this.addColorToList(hexColor);
      }
    }

    setTimeout(() => {
      this.createFile();
    }, 1000);
  };

  createFile = () => {
    let text = "";
    let looper = 0;

    let listColors = "\n$colors: (\n";

    for (let index = 0; index < Object.entries(this.colors).length; index++) {
      const [hexa, number] = Object.entries(this.colors)[index];

      text += `$color-${number}: ${hexa};\n`;
      listColors += `\t${number}: $color-${number},\n`;
    }

    listColors += ");\n";
    text += listColors + "\n";

    let shadows = "";
    for (let index = 0; index < this.map.length; index++) {
      const item = this.map[index];

      shadows += `${item},`;
      looper++;

      if (looper == this.grid.cols) {
        shadows += "\n";
        looper = 0;
      }
    }

    text += "$pokemon:\n";
    text += shadows.slice(0, -2) + ";";

    text += `\n\n.pokemon.${this.options.name} {\n`;
    text += "\tbox-shadow: pixelart($pokemon);\n";
    text += "}\n";

    let output = this.options.output || `"./pokemon-${this.options.name}.scss}`;

    if (this.options.folder !== "") {
      output = `${output}/_${this.options.name}.scss`;
    }

    output = path.resolve(output);

    fs.writeFile(output, text, (err) => {
      if (err) throw err;

      console.log("Archivo creado.");
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

      "-n": "--name",
      "-r": "--rows",
      "-c": "--cols",
      "-o": "--output",
      "-f": "--folder",
    },
    {
      argv: rawArgs.slice(2),
    }
  );

  //if (!args._[0]) throw new Error("necesitas indicar la imagen a procesar");

  return {
    help: args["--help"] || false,
    name: args["--name"] || `pokemon-${nanoid(10)}`,
    rows: args["--rows"] || 56,
    cols: args["--cols"] || 56,
    output: args["--output"] || "",
    folder: args["--folder"] || "",
    input: args._[0] || undefined,
  };
};

// main function
export const cli = (args) => {
  const options = parseArguments(args);

  if (options.input !== undefined) {
    const parser = new ParseImage(options);
  } else if (options.folder !== "") {
    fs.readdir(options.folder, (err, images) => {
      if (err) {
        return console.log("Unable to scan directory: " + err);
      }

      images.forEach(function (image) {
        const name = `pokemon-${image.split(".")[0]}`;
        new ParseImage({
          ...options,
          name,
          input: `${options.folder}/${image}`,
        });
      });
    });
  }
};
