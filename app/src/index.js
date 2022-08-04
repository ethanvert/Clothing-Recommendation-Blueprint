import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
const Model = require('./Model.js');

class Interface extends Component {
  constructor(props) {
    super(props);
    this.model = Model;
    this.state = {
      compileAndTrain: false,
      weight: 0,
      height: 0,
      bustSize: 0,
      age: 0,
      size: -1
    };
  }

  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value ? name !== 'height' : formatHeight(value)
    });
  }

  handleSumbit(event) {
    alert('Your predicted size is: ' + this.state.size);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Enter your Height Formatted ft' in":
          <input
            name="height"
            type="text"
            value={this.state.height}
            onChange={this.handleChange}
          />
        </label>
        <br />
        <label>
          Enter Your Weight in lbs:
          <input 
            name="weight"
            type="number"
            value={this.state.weight}
            onChange={this.handleChange}
          />
        </label>
        <br />
        <label>
          Enter Your Age:
          <input 
            name="age"
            type="number"
            value={this.state.age}
            onChange={this.handleChange}
          />
        </label>
          Enter Your Bust Size:
          <input />
      </form>
    );
  }
}

function inchToCm(inch) {
  return inch * 2.54;
}

function formatHeight(height) {
  let feet = height.split('\'')[0];
  let inches = height.split('\'')[1].strip().split('"')[0];

  return (inchToCm(feet * 12) + inchToCm(inches));
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Interface />);

