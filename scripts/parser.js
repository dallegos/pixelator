const input = document.getElementById("file");
const textarea = document.getElementById("textarea");
const button = document.getElementById("parseImage");
const nameInput = document.getElementById("name");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
context.imageSmoothingEnabled = false;

const list = [];
const colors = {
  "#000000": 1,
  "#ffffff": 2,
};
const parts = {
  x: 56,
  y: 56,
};

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

input.addEventListener("change", (e) => {
  let img = new Image();
  let file = e.target.files[0];

  img.width = parts.x * 10;
  img.height = parts.y * 10;

  if (file.type.match("image.*")) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      if (e.target.readyState == FileReader.DONE) {
        img.src = e.target.result;
        setTimeout(() => {
          processImage(img);
        }, 600);
      }
    };
  }
});

const processImage = (img) => {
  list.length = 0;
  //context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(img, 0, 0, img.width, img.height);
  context.strokeStyle = "red";

  // Loop for rows
  for (let row = 1; row <= parts.y; row++) {
    // Loop for cols
    for (let col = 1; col <= parts.x; col++) {
      console.log(`ROW: ${row}, COL: ${col}`);

      var pixel = context.getImageData(col * 10 - 5, row * 10 - 5, 1, 1);
      var hexColor = rgbToHex(pixel.data[0], pixel.data[1], pixel.data[2]);

      addColorToList(hexColor);
    }
  }
};

addColorToList = (hexColor) => {
  if (colors[hexColor] === undefined) {
    colors[hexColor] =
      colors[Object.keys(colors)[Object.keys(colors).length - 1]] + 1;
  }

  list.push(colors[hexColor]);
};

getList = () => {
  textarea.value = "";

  let text = "";
  let looper = 0;
  
  let listColors = "\n$colors: (\n";
  
  for (let index = 0; index < Object.entries(colors).length; index++) {
    const [hexa, number] = Object.entries(colors)[index];
    
    text += `$color-${number}: ${hexa};\n`;
    listColors += `\t${number}: $color-${number},\n`;
  }

  listColors += ");\n";
  text += listColors + "\n";

  let shadows = "";
  for (let index = 0; index < list.length; index++) {
    const item = list[index];

    shadows += `${item},`;
    looper++;

    if (looper == parts.x) {
      shadows += "\n";
      looper = 0;
    }
  }

  text += "$pokemon:\n";
  text += shadows.slice(0, -2) + ";";

  text += `\n\n.pokemon.${nameInput.value || "poke"} {\n`;
  text += "\tbox-shadow: pixelart($pokemon);\n";
  text += "}\n";

  textarea.value = text;
};


button.addEventListener("click", (e) => {
  e.preventDefault();
  getList();
})