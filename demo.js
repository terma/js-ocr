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

var App = angular.module('App', []);

App.controller('controller', ['$scope', function ($scope) {

    $scope.fontSize = 24;

    $scope.testText = 'Just take a car.\n' +
        'Total 10.00\n' +
        'Mama\n' +
        'Don\'t cry!';

    $scope.$watch('testText', function () {
        var canvas = document.getElementById('original');
        canvas.width = canvas.width;
        var ctx = canvas.getContext('2d');

        angular.forEach($scope.testText.split('\n'), function (line, lineIndex) {
            drawText(ctx, line, lineIndex);
        });

        $scope.recognized();
    });

    function horizontalLineSumColor(image, x, y0, y1) {
        var sum = 0;
        for (var y = y0; y < y1; y++) {
            var redPixel = image.data[(y * image.width * 4) + (x * 4) + 0];
            var greenPixel = image.data[(y * image.width * 4) + (x * 4) + 1];
            var bluePixel = image.data[(y * image.width * 4) + (x * 4) + 2];
            var alphaPixel = image.data[(y * image.width * 4) + (x * 4) + 3];
            //if (redPixel > 0 || greenPixel > 0 || bluePixel > 0 || alphaPixel > 0)
            //    console.log('R:' + redPixel + 'G:' + greenPixel + 'B:' + bluePixel + 'A:' + alphaPixel);
            sum += alphaPixel;
        }
        return sum;
    }

    function recongnizeCharacters(imageData) {
        var wordCoords = [];

        var linesCoords = recongnizeLines(imageData);

        angular.forEach(linesCoords, function (lineCoord) {
            var startLineX = void 0;
            for (var x = 0; x < imageData.width; x++) {
                var lineSum = horizontalLineSumColor(imageData, x, lineCoord.start, lineCoord.end);

                if (lineSum < 350) {
                    if (!startLineX) {
                        // skip just additional white line
                    } else {
                        wordCoords.push({
                            x0: startLineX,
                            x1: x - 1,
                            y0: lineCoord.start,
                            y1: lineCoord.end
                        });
                        startLineX = void 0;
                    }
                } else {
                    if (!startLineX) {
                        startLineX = x;
                    }
                }
            }
        });

        console.log('word coords:');
        console.log(wordCoords);
        return wordCoords;
    }

    function recongnizeLines(imageData) {
        function verticalLineSumColor(image, line) {
            var sum = 0;
            for (var x = 0; x < image.width; x++) {
                var redPixel = image.data[(line * image.width * 4) + (x * 4) + 0];
                var greenPixel = image.data[(line * image.width * 4) + (x * 4) + 1];
                var bluePixel = image.data[(line * image.width * 4) + (x * 4) + 2];
                var alphaPixel = image.data[(line * image.width * 4) + (x * 4) + 3];
                //if (redPixel > 0 || greenPixel > 0 || bluePixel > 0 || alphaPixel > 0)
                //    console.log('R:' + redPixel + 'G:' + greenPixel + 'B:' + bluePixel + 'A:' + alphaPixel);
                sum += alphaPixel;
            }
            return sum;
        }

        var startLineY = void 0;
        var linesCoordinates = [];

        for (var y = 0; y < imageData.height; y++) {
            var lineSum = verticalLineSumColor(imageData, y);

            if (lineSum === 0) {
                if (!startLineY) {
                    // skip just additional white line
                } else {
                    linesCoordinates.push({start: startLineY, end: y - 1});
                    startLineY = void 0;
                }
            } else {
                if (!startLineY) {
                    startLineY = y;
                }
            }
        }

        return linesCoordinates;
    }

    $scope.recognized = function () {
        var originalCanvas = document.getElementById('original');
        var originalCtx = originalCanvas.getContext('2d');
        var originalImage = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);

        var characterCoords = recongnizeCharacters(originalImage);

        try {
            var characterOcr = new CharacterOcr($scope.fontSize);
            var studyCases = characterOcr.study();

            document.getElementById('studyImages').innerHTML = '';
            for (var i = 0; i < studyCases.length; i++) {
                var img = document.createElement('img');
                img.src = studyCases[i].url;
                document.getElementById('studyImages').appendChild(img);
            }

            // reco
            var recognize = characterOcr.recognize(originalImage, characterCoords);

            document.getElementById('recognized').innerText = '';

            var networkResult = '';

            angular.forEach(recognize.result, function (item) {
                document.getElementById('recognized').innerText += item.character;

                networkResult += item.character + ' ';
                angular.forEach(item.neuronOutputs, function (o, index) {
                    networkResult += characterOcr.characters[index] + '=' + Math.round(o) + ' ';
                });
                networkResult += '<p>'
            });
            document.getElementById('networkResult').innerHTML = networkResult;

            document.getElementById('characterImages').innerHTML = '';
            for (var i = 0; i < recognize.characterImages.length; i++) {
                var img = document.createElement('img');
                img.src = recognize.characterImages[i];
                document.getElementById('characterImages').appendChild(img);
            }
        } catch (e) {
            console.log(e);
        }

        // ---

        var resultCanvas = document.getElementById('result');
        resultCanvas.width = resultCanvas.width;
        var resultCtx = resultCanvas.getContext('2d');

        angular.forEach(characterCoords, function (textCoord) {
            //ctx.font = 'bold 14px sans-serif';
            resultCtx.strokeStyle = "#00FF00";

            resultCtx.beginPath();
            resultCtx.rect(textCoord.x0 + 0.5, textCoord.y0 + 0.5, textCoord.x1 - textCoord.x0, textCoord.y1 - textCoord.y0);
            resultCtx.stroke();
        });
    };

    function drawText(ctx, text, lineIndex) {
        ctx.font = 'bold ' + $scope.fontSize + 'px sans-serif';
        ctx.fillText(text, 5, (lineIndex + 1) * 30);
    }

}]);