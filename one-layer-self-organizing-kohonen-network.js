function OneLayerSelfOrganizingKohonenNetwork(inputCount, outputCount) {
    this.neurons = [];
    this.inputCount = inputCount;
    this.outputCount = outputCount;
    this.studySpeed = 0.5; //0.5

    for (var j = 0; j < outputCount; j++) {
        var neuron = {inputWeights: []};
        for (var h = 0; h < inputCount; h++) {
            //neuron.inputWeights.push(Math.random()); // random by default?
            neuron.inputWeights.push(0); // random by default?
        }

        this.neurons.push(neuron);
    }
}

OneLayerSelfOrganizingKohonenNetwork.prototype.study = function (input, outputIndex) {
    var neuron = this.neurons[outputIndex];
    for (var i = 0; i < neuron.inputWeights.length; i++) {
        var originalWeight = neuron.inputWeights[i];
        //neuron.inputWeights[i] = originalWeight + 0.5 * (input[i] - originalWeight); -> oW + 0.5 * i - 0.5 * oW -> oW * (1 - 0.5) + 0.5 * i
        neuron.inputWeights[i] = originalWeight * (1 - this.studySpeed) + (input[i] * this.studySpeed);
    }
};

OneLayerSelfOrganizingKohonenNetwork.prototype.decideWithDebug = function (input) {
    if (this.inputCount !== input.length) throw Error('Expected array[' + this.inputCount + '] but got array[' + input.length + ']!');

    var neuronOutputs = [];

    for (var j = 0; j < this.outputCount; j++) {
        var sum = 0;
        for (var i = 0; i < this.inputCount; i++) {
            sum += Math.pow((input[i] - this.neurons[j].inputWeights[i]), 2);
        }
        neuronOutputs[j] = Math.sqrt(sum);
    }

    // result WTA (Winner Takes All)
    var minIndex = 0;
    var minValue = neuronOutputs[minIndex];
    for (var j = 1; j < this.outputCount; j++) {
        if (neuronOutputs[j] < minValue) {
            minIndex = j;
            minValue = neuronOutputs[minIndex];
        }
    }

    // keep winner reset other
    var output = [];
    for (var j = 0; j < this.outputCount; j++) {
        if (j !== minIndex) output[j] = 0;
        else output[j] = 1;
    }

    return {output: output, neuronOutputs: neuronOutputs};
};

OneLayerSelfOrganizingKohonenNetwork.prototype.decide = function (input) {
    return this.decideWithDebug(input).output;
};

