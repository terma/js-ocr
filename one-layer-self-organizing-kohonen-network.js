function OneLayerSelfOrganizingKohonenNetwork(inputCount, outputCount) {
    this.neurons = [];
    this.inputCount = inputCount;
    this.outputCount = outputCount;
    this.studySpeed = 0.1; //0.5

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
        neuron.inputWeights[i] = originalWeight + 0.5 * (input[i] - originalWeight);
    }
};

OneLayerSelfOrganizingKohonenNetwork.prototype.decide = function (input) {
    if (this.inputCount !== input.length) throw Error('Invalid input!');

    var neuronOutputs = [];

    for (var j = 0; j < this.outputCount; j++) {
        var sum = 0;
        for (var i = 0; i < this.inputCount; i++) {
            sum += this.studySpeed + this.neurons[j].inputWeights[i] * input[i];
        }

        //var neuronOutput = b[j] + sum;
        var neuronOutput = sum;
        neuronOutputs[j] = neuronOutput;
    }

    // result WTA (Winner Takes All)
    var maxIndex = 0;
    var maxValue = neuronOutputs[maxIndex];
    for (var j = 1; j < this.outputCount; j++) {
        if (neuronOutputs[j] > maxValue) {
            maxIndex = j;
            maxValue = neuronOutputs[maxIndex];
        }
    }

    // keep winner reset other
    var output = [];
    for (var j = 0; j < this.outputCount; j++) {
        if (j !== maxIndex) output[j] = 0;
        else output[j] = 1;
    }

    return output;
};

