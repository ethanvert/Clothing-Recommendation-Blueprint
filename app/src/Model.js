const tf = require('@tensorflow/tfjs-node');
const TRAINING_DATA_PATH = '../Clothing_Recommendation_Model/renttherunway_training_data.csv';
const TRAINING_VALIDATION_PATH = '../Clothing_Recommendation_Model/renttherunway_training_validation.csv';
const TESTING_DATA_PATH = '../Clothing_Recommendation_Model/renttherunway_test_validation.csv';
const MIN_HEIGHT = 137.16;
const MAX_HEIGHT = 198.12;
const MIN_WEIGHT = 50;
const MAX_WEIGHT = 300;
const MIN_AGE = 14;
const MAX_AGE = 60;
const MIN_BUST_SIZE = 28;
const MAX_BUST_SIZE = 53;
const TRAINING_DATA_LENGTH = 87828;
const TRAINING_VALIDATION_LENGTH = 29276;
const TESTING_DATA_LENGTH = 29277;
const COL_NAMES = ['bust_size', 'item_id', 'weight', 
'height', 'size', 'age'];

const testValidation = tf.data.csv(TESTING_DATA_PATH,{
                                      hasHeader: true, 
                                      columnNames: COL_NAMES, 
                                      columnConfigs: {size: {isLabel: true}}
                                    }).map(normalizeData)
                                      .shuffle(TESTING_DATA_LENGTH)
                                      .batch(TESTING_DATA_LENGTH);
const trainValidation = tf.data.csv(TRAINING_VALIDATION_PATH, {
                                        hasHeader: true, 
                                        columnNames: COL_NAMES, 
                                        columnConfigs: {size: {isLabel: true}}
                                    }).map(normalizeData)
                                      .shuffle(TRAINING_VALIDATION_LENGTH)
                                      .batch(TRAINING_VALIDATION_LENGTH);
const training = tf.data.csv(TRAINING_DATA_PATH,{
                              hasHeader: true, 
                              columnNames: COL_NAMES, 
                              columnConfigs: {size: {isLabel: true}}
                            }).map(normalizeData)
                              .shuffle(TRAINING_DATA_LENGTH)
                              .batch(TRAINING_DATA_LENGTH);
class Model {
  constructor() {
    this.tf = tf;
    this.model = undefined;
    this.testValidation = testValidation;
    this.trainValidation = trainValidation;
    this.training = training;
  }

  createModel() {
    this.model = tf.sequential();
    this.model.add(tf.layers.dense({inputShape: [5], units:500, activation: 'relu'}));
    this.model.add(tf.layers.dense({units: 250, activation: 'relu'}));
    this.model.add(tf.layers.dense({units: 125, activation: 'relu'}));
    this.model.add(tf.layers.dense({units: this.NUM_SIZES, activation: 'softmax'}));

    this.model.compile({
        optimizer: tf.train.adam(),
        loss: tf.losses.meanSquaredError,
        metrics: ['mse'],
    });
  }

  async trainModel(epochs)
  // trains model
  {
    await this.model.fitDataset(this.training, {epochs: epochs});
    console.log('Accuracy', await this.evaluate(true));
  }

  evalAccuracy(i, values, classSize) {
    let index = (i * classSize * this.NUM_SIZES) + i;
    let total = 0;
    for (let j = 0; i < classSize; j++) {
      total += values[index];
      index += this.NUM_SIZES;
    }
    return total / classSize;
  }

  async evaluate(test) {
    let res = {};
    await this.trainValidation.forEachAsync(elem => {
        console.log("here");
        const vals = this.model.predict(elem.xs);
        const classSize = this.TRAINING_DATA_LENGTH / this.NUM_SIZES;

        for (let i = 0; i < this.NUM_SIZES; i++) {
            res[i].training = this.evalAccuracy(i, vals, classSize);
        }
    });

    console.log("there");

    if (test) {
        await this.testValidation.forEachAsync(elem => {
            const vals = this.model.predict(elem.xs);
            const classSize = this.TESTING_DATA_LENGTH / this.NUM_SIZES;
    
            for (let i = 0; i < this.NUM_SIZES; i++) {
                res[i].testing = this.evalAccuracy(i, vals, classSize);
            }
        });
    }  
    console.log("up");

    return res;
  }

  predictSizeFromSample(sample) {
    let res = this.model.predict(tf.tensor(sample, [1, sample.length])).arraySync();
    let max = 0;
    let size = 0;
    for (let i = 0; i < this.NUM_SIZES; i++) {
      if (res[0][i] > max) {
        size = i;
        max = res[0][i];            
      }
    }
    
    return size;
  }
}

function normalizeData(xs, ys) {
  const vals = [minMaxNormalize(xs.weight, MIN_WEIGHT, MAX_WEIGHT),
                minMaxNormalize(xs.height, MIN_HEIGHT, MAX_HEIGHT),
                minMaxNormalize(xs.age, MIN_AGE, MAX_AGE),
                minMaxNormalize(xs.bust_size, MIN_BUST_SIZE, MAX_BUST_SIZE),
                xs.age];
  return {xs: vals, ys: ys.size};
}

function minMaxNormalize(val, min, max) 
//REQUIRES: min == min(data) && max = max(data);
//ENSURES: 0 <= data && data <= 1;
{
  if (!min || !max) {
    return val;
  }
    return (val - min) / (max - min);
}

export default Model;