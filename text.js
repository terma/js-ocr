var App = angular.module('App', []);

App.controller('controller', ['$scope', '$timeout', function ($scope, $timeout) {

    $scope.fontSize = 24;

    $scope.text = [
        'Just take a car.',
        'Total 10.00',
        'Mama'
    ];


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

    $scope.init = function () {
        var canvas = document.getElementById('original');
        canvas.width = canvas.width;
        var ctx = canvas.getContext('2d');

        angular.forEach($scope.text, function (line, lineIndex) {
            drawText(ctx, line, lineIndex);
        });

        $scope.recognized();
    };

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
            var studyCases = characterOcr.startStudy();

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

    $scope.init();

}]);