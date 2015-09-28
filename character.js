var App = angular.module('App', []);

App.controller('controller', ['$scope', '$timeout', function ($scope, $timeout) {

    $scope.characters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    $scope.pictureSide = 20;
    $scope.acceptedAccuracy = 0.8;

    $scope.$watch('pictureSide', function () {
        $scope.init();
    });

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
        $scope.stopStudy();
        $scope.network = new OneLayerKohenNetwork($scope.pictureSide * $scope.pictureSide, $scope.characters.length);
        $scope.studyCycle = 0;
        $scope.accuracy = -1;
    };

    $scope.download = function () {
        saveData($scope.network, 'network-settings.json');
    };

    $scope.startStudy = function () {
        if ($scope.studyInterval) return;

        $scope.studyStartTime = Date.now();

        function studyCycle() {
            var canvas = angular.element('<canvas width="' + $scope.pictureSide + '" height="' + $scope.pictureSide + '" style="visibility: hidden;"></canvas>')[0];
            angular.element(document.body).append(canvas);

            // one cycle
            for (var c = 0; c < $scope.characters.length; c++) {
                var characterImage = drawCharacter(canvas, $scope.characters[c]);
                var input = imageToInput(characterImage);
                $scope.network.study(input, c);
            }

            $scope.studyCycle++;
            $scope.studyTime = Date.now() - $scope.studyStartTime;

            angular.element(canvas).remove();

            $scope.test();

            $scope.accuracy = $scope.result.success / $scope.result.tests.length;
            if ($scope.accuracy < $scope.acceptedAccuracy) $scope.studyTimeout = $timeout(studyCycle);
            else $scope.studyTimeout = void 0;
        }

        $scope.studyTimeout = $timeout(studyCycle);
    };

    $scope.stopStudy = function () {
        if ($scope.studyTimeout) {
            $timeout.cancel($scope.studyTimeout);
            $scope.studyTimeout = void 0;
        }
    };

    function outputToCharacter(output) {
        var index = output.indexOf(1);
        return $scope.characters[index];
    }

    $scope.test = function () {
        var canvas = angular.element('<canvas width="' + $scope.pictureSide + '" height="' + $scope.pictureSide + '" style="visibility: hidden;"></canvas>')[0];
        angular.element(document.body).append(canvas);

        $scope.result = {success: 0, tests: []};
        for (var c = 0; c < $scope.characters.length; c++) {
            var test = $scope.characters[c];

            $scope.testCharacter = test;
            var image = drawCharacter(canvas, test);
            var input = imageToInput(image);
            var output = $scope.network.decide(input);

            var recognized = outputToCharacter(output);

            if (test == recognized) $scope.result.success++;
            $scope.result.tests.push({
                test: test,
                recognized: recognized
            });
        }

        angular.element(canvas).remove();
    };

    function drawCharacter(canvas, character) {
        canvas.width = canvas.width;

        var ctx = canvas.getContext('2d');
        ctx.save();
        //ctx.rotate((Math.PI / 180) * (5 - 10 * Math.random()));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold ' + $scope.pictureSide + 'px sans-serif';
        ctx.fillText(character, canvas.width / 2, canvas.height / 2);

        var image = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.restore();

        return image;

    }

    $scope.init();

}]);

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function saveData(data, fileName) {
    var a = window.saveDataA;
    if (!a) {
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        window.saveDataA = a;
    }

    var json = JSON.stringify(data),
        blob = new Blob([json], {type: "octet/stream"}),
        url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
};