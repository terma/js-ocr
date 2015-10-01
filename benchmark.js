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

    $scope.testCases = [];

    $scope.testText = 'Item        Qty Price Amount\n' +
        '----------------------------\n' +
        'Milk       2Gal 15.00  15.00\n' +
        'Watermelon  3.5  2.00   7.00\n' +
        '              Subtotal 23.00\n' +
        '                  Tax:  5.25\n' +
        '----------------------------\n' +
        '                Total: 28.25';

    $scope.addTestCase = function (fontSize) {
        var canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        var ctx = canvas.getContext('2d');

        $scope.testText.split('\n').forEach(function (line, lineIndex) {
            drawText(ctx, line, lineIndex, fontSize);
        });

        var originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

        var start = Date.now();
        var ocrResult = recognize(originalImage, fontSize);
        var time = Date.now() - start;

        var recoCharacters = ocrResult.text.replace(/\n/g, '');
        var testCharacters = $scope.testText.replace(/ /g, '').replace(/\n/g, '');
        var mis = 0;
        for (var c = 0; c < testCharacters.length && c < recoCharacters.length; c++) {
            if (testCharacters[c] !== recoCharacters[c]) mis++;
        }
        var accuracy = (100 / testCharacters.length) * (testCharacters.length - mis);

        $scope.testCases.push({
            time: time,
            fontSize: fontSize,
            img: canvas.toDataURL(),
            text: ocrResult.text,
            accuracy: accuracy
        });
    };

    function drawText(ctx, text, lineIndex, fontSize) {
        ctx.font = 'bold ' + fontSize + 'px sans-serif';
        ctx.fillText(text, 5, (lineIndex + 1) * fontSize);
    }

    $scope.addTestCase(16);
    $scope.addTestCase(20);
    $scope.addTestCase(24);
    $scope.addTestCase(32);

}]);