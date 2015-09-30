/*
 The MIT License (MIT)

 Copyright (c) 2015 Artem Stasiuk

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

function CharacterOcr(fontSize) {
    var ch = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    this.characters = [];
    for (var c = 0; c < ch.length; c++) {
        this.characters.push(ch[c]);
        this.characters.push(ch[c].toLowerCase());
    }
    for (var c = 0; c < 10; c++) {
        this.characters.push('' + c);
    }
    this.characters.push('.');

    this.characters = sortCharactersByWeight(this.characters, fontSize);

    this.network = new OneLayerSelfOrganizingKohonenNetwork(fontSize * fontSize, this.characters.length);
    this.fontSize = fontSize;
    this.accuracy = 0.5;

    this.studyMaxRotation = 0;
}

function resizeImage(image, w, h) {
    var resized = [];

    var xOffset = Math.floor((w - image[0].length) / 2); // 4 to 8 - off = 2
    var yOffset = Math.floor((h - image.length) / 2);

    for (var y = 0; y < h; y++) {
        var imageY = y - yOffset;

        var row = [];
        resized.push(row);

        if (imageY < 0 || imageY >= image.length) {
            for (var x = 0; x < w; x++) {
                row.push({red: 0, green: 0, blue: 0, alpha: 0});
            }
        } else {
            for (var x = 0; x < w; x++) {
                var imageX = x - xOffset; // 0 - 2 = -2

                //console.log(imageX + ' ' + imageY);

                if (imageX < 0 || imageX >= image[0].length) {
                    // skip default color
                    row.push({red: 0, green: 0, blue: 0, alpha: 0});
                } else {
                    row.push(image[imageY][imageX]);
                }
            }
        }
    }

    return resized;
}

function imageToUrl(image) {
    var canvas = document.createElement('canvas');
    canvas.height = image.length;
    canvas.width = image[0].length;
    var ctx = canvas.getContext("2d");
    var canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    for (var y = 0; y < image.length; y++) {
        for (var x = 0; x < image[y].length; x++) {
            var pos = (y * image[y].length + x) * 4; // position in buffer based on x and y
            canvasData.data[pos] = image[y][x].red;           // some R value [0, 255]
            canvasData.data[pos + 1] = image[y][x].green;           // some G value
            canvasData.data[pos + 2] = image[y][x].blue;           // some B value
            canvasData.data[pos + 3] = image[y][x].alpha;           // set alpha channel
        }
    }

    ctx.putImageData(canvasData, 0, 0);
    var url = canvas.toDataURL();
    return url;
}

function imageToInputByCoord(image) {
    var input = [];
    for (var y = 0; y < image.length; y++) {
        for (var x = 0; x < image[y].length; x++) {
            //input.push(Math.round(image[y][x].alpha - 255 / 2));
            input.push(image[y][x].alpha);
        }
    }
    return input;
}

function subImage(image, coords) {
    var sumImage = [];
    for (var y = coords.y0; y < coords.y1; y++) {
        var row = [];
        sumImage.push(row);
        for (var x = coords.x0; x < coords.x1; x++) {
            row.push(image[y][x]);
        }
    }
    return sumImage;
}

function flatImageToImage(image) {
    var result = [];

    for (var y = 0; y < image.height; y++) {
        var row = [];
        result.push(row);

        for (var x = 0; x < image.width; x++) {
            row.push({
                red: image.data[(y * image.width * 4) + (x * 4) + 0],
                green: image.data[(y * image.width * 4) + (x * 4) + 1],
                blue: image.data[(y * image.width * 4) + (x * 4) + 2],
                alpha: image.data[(y * image.width * 4) + (x * 4) + 3]
            });
        }
    }

    return result;
}
function imageWeight(image) {
    var weight = 0;
    for (var y = 0; y < image.height; y++) {
        for (var x = 0; x < image.width; x++) {
            weight += image.data[(y * image.width * 4) + (x * 4) + 3];
        }
    }
    return weight;
}

CharacterOcr.prototype.recognize = function (image, characterCoords) {
    var realImage = flatImageToImage(image);
    var characterImages = [];

    var self = this;
    var result = [];
    angular.forEach(characterCoords, function (characterCoord) {
        var p = subImage(realImage, characterCoord);
        var characterImage = resizeImage(p, self.fontSize, self.fontSize);
        characterImages.push(imageToUrl(characterImage));
        var input = imageToInputByCoord(characterImage);

        var decision = self.network.decideWithDebug(input);
        var index = decision.output.indexOf(1);
        result.push({character: self.characters[index], neuronOutputs: decision.neuronOutputs});
    });

    console.log('recognized');
    console.log(result);
    return {result: result, characterImages: characterImages};
};

function imageToInput(image) {
    var input = [];
    for (var y = 0; y < image.height; y++) {
        for (var x = 0; x < image.width; x++) {
            var redPixel = image.data[(y * image.width * 4) + (x * 4) + 0];
            var greenPixel = image.data[(y * image.width * 4) + (x * 4) + 1];
            var bluePixel = image.data[(y * image.width * 4) + (x * 4) + 2];
            var alphaPixel = image.data[(y * image.width * 4) + (x * 4) + 3];
            //if (redPixel > 0 || greenPixel > 0 || bluePixel > 0 || alphaPixel > 0)
            //    console.log('R:' + redPixel + 'G:' + greenPixel + 'B:' + bluePixel + 'A:' + alphaPixel);
            input.push(alphaPixel);
        }
    }
    return input;
}

function sortCharactersByWeight(characters, fontSize) {
    var canvas = document.createElement('canvas');
    canvas.width = fontSize;
    canvas.height = fontSize;

    var charactersWithWeight = [];
    for (var c = 0; c < characters.length; c++) {
        var characterImage = drawCharacter(canvas, characters[c], 0, fontSize);
        charactersWithWeight.push({character: characters[c], weight: imageWeight(characterImage.data)});
    }

    charactersWithWeight.sort(function (f, s) {
        return f.weight - s.weight;
    });

    var sortedCharacters = [];
    angular.forEach(charactersWithWeight, function (c) {
        sortedCharacters.push(c.character);
    });
    return sortedCharacters;
}

CharacterOcr.prototype.startStudy = function () {
    var self = this;

    // init test data
    var studyCases = [];

    var canvas = document.createElement('canvas');
    canvas.width = this.fontSize;
    canvas.height = this.fontSize;

    for (var c = 0; c < this.characters.length; c++) {
        if (this.studyMaxRotation != 0) {
            for (var r = -this.studyMaxRotation; r < this.studyMaxRotation; r++) {
                var studyCase = drawCharacter(canvas, this.characters[c], r, this.fontSize);
                studyCase.index = c;
                studyCases.push(studyCase);
            }
        } else {
            var studyCase = drawCharacter(canvas, this.characters[c], 0, this.fontSize);
            studyCase.index = c;
            studyCases.push(studyCase);
        }
    }

    function studyCycle() {
        for (var c = 0; c < studyCases.length; c++) {
            var input = imageToInput(studyCases[c].data);
            self.network.study(input, studyCases[c].index);
        }
    }

    for (var i = 0; i < 3; i++) {
        studyCycle();
    }

    console.log('study finished');
    console.log(this.network);
    return studyCases;
};

CharacterOcr.prototype.stopStudy = function () {
    if (this.studyTimeout) {
        window.clearTimeout(this.studyTimeout);
        this.studyTimeout = void 0;
    }
};

function drawCharacter(canvas, character, rotation, fontSize) {
    canvas.width = canvas.width;

    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.rotate((Math.PI / 180) * rotation);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold ' + fontSize + 'px sans-serif';
    ctx.fillText(character, canvas.width / 2, canvas.height / 2);

    var imageUrl = canvas.toDataURL();
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.restore();

    return {url: imageUrl, data: imageData};
};
