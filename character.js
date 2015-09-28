var App = angular.module('App', []);

App.controller('controller', ['$scope', '$timeout', function ($scope, $timeout) {

    $scope.characters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    $scope.pictureSide = 20;
    $scope.acceptedAccuracy = 0.7;
    $scope.studyMaxRotation = 0;
    $scope.testMaxRotation = 5;

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
        $scope.network = new OneLayerSelfOrganizingKohonenNetwork($scope.pictureSide * $scope.pictureSide, $scope.characters.length);
        $scope.studyCycle = 0;
        $scope.accuracy = -1;
        $scope.testResults = [];
    };

    $scope.download = function () {
        saveData($scope.network, 'network-settings.json');
    };

    $scope.startStudy = function () {
        if ($scope.studyTimeout) return;

        $scope.studyCycle = 0;

        // init test data
        function createTestCases() {
            $scope.testResults = [];
            var canvas = angular.element('<canvas width="' + $scope.pictureSide + '" height="' + $scope.pictureSide + '" style="visibility: hidden;"></canvas>')[0];
            angular.element(document.body).append(canvas);

            for (var c = 0; c < $scope.characters.length; c++) {
                if ($scope.testMaxRotation != 0) {
                    for (var r = -$scope.testMaxRotation; r < $scope.testMaxRotation; r++) {
                        var studyCase = drawCharacter(canvas, $scope.characters[c], r);
                        studyCase.character = $scope.characters[c];
                        studyCase.success = 0;
                        studyCase.count = 0;
                        $scope.testResults.push(studyCase);
                    }
                } else {
                    var studyCase = drawCharacter(canvas, $scope.characters[c], 0);
                    studyCase.character = $scope.characters[c];
                    studyCase.success = 0;
                    studyCase.count = 0;
                    $scope.testResults.push(studyCase);
                }
            }
        }

        createTestCases();

        // init study data
        $scope.studyCases = [];
        var canvas = angular.element('<canvas width="' + $scope.pictureSide + '" height="' + $scope.pictureSide + '" style="visibility: hidden;"></canvas>')[0];
        angular.element(document.body).append(canvas);

        for (var c = 0; c < $scope.characters.length; c++) {
            if ($scope.studyMaxRotation != 0) {
                for (var r = -$scope.studyMaxRotation; r < $scope.studyMaxRotation; r++) {
                    var studyCase = drawCharacter(canvas, $scope.characters[c], r);
                    studyCase.index = c;
                    $scope.studyCases.push(studyCase);
                }
            } else {
                var studyCase = drawCharacter(canvas, $scope.characters[c], 0);
                studyCase.index = c;
                $scope.studyCases.push(studyCase);
            }
        }
        angular.element(canvas).remove();

        // study
        $scope.studyTime = Date.now() - $scope.studyStartTime;
        $scope.studyStartTime = Date.now();

        function studyCycle() {
            // one cycle
            for (var c = 0; c < $scope.studyCases.length; c++) {
                var input = imageToInput($scope.studyCases[c].data);
                $scope.network.study(input, $scope.studyCases[c].index);
            }

            $scope.studyCycle++;
            $scope.studyTime = Date.now() - $scope.studyStartTime;

            $scope.test();

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
        var success = 0;

        for (var testCaseIndex = 0; testCaseIndex < $scope.testResults.length; testCaseIndex++) {
            var test = $scope.testResults[testCaseIndex];

            var input = imageToInput(test.data);
            var output = $scope.network.decide(input);
            var recognized = outputToCharacter(output);

            test.recognized = recognized;

            if (test.character == recognized) {
                test.success = true;
                success++;
            } else {
                test.success = false;
            }
            test.count++;
        }

        $scope.accuracy = success / $scope.testResults.length;
    };

    function drawCharacterToData(canvas, character) {
        return drawCharacter(canvas, character).data;
    }

    function drawCharacter(canvas, character, rotation) {
        canvas.width = canvas.width;

        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.rotate((Math.PI / 180) * rotation);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold ' + $scope.pictureSide + 'px sans-serif';
        ctx.fillText(character, canvas.width / 2, canvas.height / 2);

        var imageUrl = canvas.toDataURL();
        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.restore();

        return {url: imageUrl, data: imageData};
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