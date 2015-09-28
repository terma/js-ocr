var App = angular.module('App', []);

App.controller('controller', ['$scope', '$interval', function ($scope, $interval) {

    $scope.outputCounts = 10;
    $scope.expectedOutputIndex = 0;

    $scope.size = 20;

    $scope.input = [];
    for (var y = 0; y < $scope.size; y++) {
        var row = [];
        for (var x = 0; x < $scope.size; x++) {
            row.push(0);
        }
        $scope.input.push(row);
    }


    $scope.$watch('outputCounts', function (newValue) {
        $scope.network = new OneLayerSelfOrganizingKohonenNetwork($scope.size * $scope.size, newValue);
    });

    $scope.mutateInput = function (x, y) {
        $scope.input[y][x] = $scope.input[y][x] > 0 ? 0 : 1;
        $scope.decide();
    };

    $scope.study = function () {
        var input = matrixToPlainArray($scope.input);
        $scope.network.study(input, $scope.expectedOutputIndex);
        $scope.decide();
    };

    function matrixToPlainArray(matrix) {
        var plainArray = [];
        for (var y = 0; y < matrix.length; y++) {
            for (var x = 0; x < matrix[y].length; x++) {
                plainArray.push(matrix[y][x]);
            }
        }
        return plainArray;
    }

    $scope.startStudy = function () {
        $scope.studyInterval = $interval(function () {
            var characters = ['T', 'O', 'A', 'L'];
            var characterIndex = getRandomInt(0, characters.length);

            var characterImage = drawCharacter(characters[characterIndex]);
            var input = [];
            for (var y = 0; y < $scope.size; y++) {
                for (var x = 0; x < $scope.size; x++) {
                    var redPixel = characterImage.data[(y * $scope.size * 4) + (x * 4) + 0];
                    var greenPixel = characterImage.data[(y * $scope.size * 4) + (x * 4) + 1];
                    var bluePixel = characterImage.data[(y * $scope.size * 4) + (x * 4) + 2];
                    var alphaPixel = characterImage.data[(y * $scope.size * 4) + (x * 4) + 3];
                    //if (redPixel > 0 || greenPixel > 0 || bluePixel > 0 || alphaPixel > 0)
                    //    console.log('R:' + redPixel + 'G:' + greenPixel + 'B:' + bluePixel + 'A:' + alphaPixel);
                    input.push(alphaPixel);
                }
            }

            console.log(input);
            $scope.network.study(input, characterIndex);
        }, 1000);
    };

    $scope.stopStudy = function () {
        if ($scope.studyInterval) {
            $interval.cancel($scope.studyInterval);
            $scope.studyInterval = void 0;
        }
    };

    $scope.decide = function () {
        var input = matrixToPlainArray($scope.input);
        $scope.output = $scope.network.decide(input);
    };

    function drawCharacter(character) {
        var canvas = document.getElementById('canvas');
        canvas.width = canvas.width;

        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.rotate((Math.PI / 180) * (5 - 10 * Math.random()));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(character, canvas.width / 2, canvas.height / 2);

        var image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.restore();

        return image;

    }

    drawCharacter('A');

}]);

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}