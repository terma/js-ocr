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
    $scope.testText = 'Item        Qty Price Amount\n' +
        '----------------------------\n' +
        'Milk       2Gal 15.00  15.00\n' +
        'Watermelon  3.5  2.00   7.00\n' +
        '              Subtotal 23.00\n' +
        '                  Tax:  5.25\n' +
        '----------------------------\n' +
        '                Total: 28.25';

    $scope.$watch('testText', function () {
        var canvas = document.getElementById('original');
        canvas.width = canvas.width; // reset canvas
        var ctx = canvas.getContext('2d');

        angular.forEach($scope.testText.split('\n'), function (line, lineIndex) {
            drawText(ctx, line, lineIndex);
        });

        $scope.recognized();
    });

    $scope.recognized = function () {
        var originalCanvas = document.getElementById('original');
        var originalCtx = originalCanvas.getContext('2d');
        var originalImage = originalCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);

        var result = recognize(originalImage, $scope.fontSize);

        document.getElementById('studyImages').innerHTML = '';
        result.studyCases.forEach(function (studyCase) {
            var img = document.createElement('img');
            img.src = studyCase.url;
            document.getElementById('studyImages').appendChild(img);
        });

        document.getElementById('recognized').innerText = '';
        var networkResult = '';
        angular.forEach(result.result.result, function (item) {
            document.getElementById('recognized').innerText += item.character;

            networkResult += item.character + ' ';
            angular.forEach(item.neuronOutputs, function (o, index) {
                networkResult += result.characterOcr.characters[index] + '=' + Math.round(o) + ' ';
            });
            networkResult += '<p>'
        });
        document.getElementById('networkResult').innerHTML = networkResult;

        document.getElementById('characterImages').innerHTML = '';
        result.result.characterImages.forEach(function (characterImage) {
            var img = document.createElement('img');
            img.src = characterImage;
            document.getElementById('characterImages').appendChild(img);
        });

        // ---

        var resultCanvas = document.getElementById('result');
        resultCanvas.width = resultCanvas.width;
        var resultCtx = resultCanvas.getContext('2d');

        angular.forEach(result.characterCoords, function (textCoord) {
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