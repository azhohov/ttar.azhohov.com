<template>
  <div class="container">
    <b-jumbotron
      header="TTAR Calculator">      
    </b-jumbotron>
    <div class="form-group row">
      <div class="col-form-label col-3">Rating</div>
      <div class="col">
        <input class="form-control" type="text" placeholder="rating 1" v-model.number="rating1" />
      </div>
      <div class="col">
        <input class="form-control" type="text" placeholder="rating 2" v-model.number="rating2" />
      </div>
    </div>
    <div class="form-group row">
      <div class="col-form-label col-3">Score</div>
      <div class="col">
        <input class="form-control" type="text" placeholder="score 1" v-model.number="score1" />
      </div>
      <div class="col">
        <input class="form-control" type="text" placeholder="score 2" v-model.number="score2" />
      </div>
    </div>
    <div class="form-group row d-none">
      <div class="col-form-label col-3">Qualification</div>
      <div class="col">
        <input class="form-control" type="checkbox" placeholder="score 1" v-model.boolean="qualification1" />
      </div>
      <div class="col">
        <input class="form-control" type="checkbox" placeholder="score 2" v-model.boolean="qualification2" />
      </div>
    </div>
    <div class="form-group row">
      <div class="col-form-label col-3">New rating</div>
      <div class="col">
        <input class="form-control" type="text" :value="steps.length > 1 ? lastStep.rating1 + ' [' + signedNumber(rating1 - lastStep.rating1) + ']' : ''" readonly />
      </div>
      <div class="col">
        <input class="form-control" type="text" :value="steps.length > 1 ? lastStep.rating2 + ' [' + signedNumber(rating2 - lastStep.rating2) + ']' : ''" readonly />
      </div>
    </div>
    <div v-for="(step,index) in steps" class="form-group row d-none">
      <div class="col-form-label col-3">R' (new rating) {{index}}</div>
      <div class="col">
        <input class="form-control" type="text" :value="step.rating1" readonly />
      </div>
      <div class="col">
        <input class="form-control" type="text" :value="step.rating2" readonly />
      </div>
    </div>
  </div>
</template>
<script>
function calc(data) {
    let e1 = 1 / (1 + Math.pow(10, (data.rating2 - data.rating1) / 400));
    let e2 = 1 / (1 + Math.pow(10, (data.rating1 - data.rating2) / 400));

    let k1 = data.qualification1 ? 30 : (data.rating1 >= 2400 ? 10 : 20);
    let k2 = data.qualification2 ? 30 : (data.rating2 >= 2400 ? 10 : 20);

    let s1 = data.score1 / (data.score1 + data.score2);
    let s2 = data.score2 / (data.score1 + data.score2);

    let d1 = Math.round(k1 * (s1 - e1));
    let d2 = Math.round(k2 * (s2 - e2));
    // let d1 = k1 * (s1 - e1);
    // let d2 = k2 * (s2 - e2);

    let newRating1 = data.rating1 + d1;
    let newRating2 = data.rating2 + d2;

    return {
        rating1: newRating1,
        rating2: newRating2,
        score1: data.score1,
        score2: data.score2,
        qualification1: data.qualification1,
        qualification2: data.qualification2
    };
}


import { BIcon, BIconCamera } from 'bootstrap-vue';
export default {
  data() {
      return {
        rating1: '',
        rating2: '',
        score1: '',
        score2: '',
        qualification1: false,
        qualification2: false
      }
  },
  computed: {
    steps: function() {
      if (!this.rating1 || !this.rating2 || !this.score1 || !this.score2) {
        return [];
      }
      let data = {
        rating1: this.rating1,
        rating2: this.rating2,
        score1: this.score1,
        score2: this.score2,
        qualification1: this.qualification1,
        qualification2: this.qualification2
      };

      let stepsCount = (data.score1 + data.score2 + 1) >> 1;

      let steps = [data];
      for (let stepNumber = 1; stepNumber <= stepsCount; stepNumber++) {
        steps[stepNumber] = calc(steps[stepNumber - 1]);
      }

      return steps;
    },
    lastStep: function() {
      return this.steps[this.steps.length - 1]; 
    }
  },
  methods: {
    signedNumber(n) {
        if (n > 0) {
          return '+' + n;
        } else {
          return '' + n;
        }
    }
  },
};
</script>
