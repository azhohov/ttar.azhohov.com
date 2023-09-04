<template>
  <div class="container">
    <b-jumbotron header-level="5"
      header="TTAR Calculator">
    </b-jumbotron>
    <div class="form-row row mb-2">
      <div class="col-form-label col-3">Rating</div>
      <div class="col">
        <input class="form-control" type="text" placeholder="rating 1" v-model.number="rating1" />
      </div>
      <div class="col">
        <input class="form-control" type="text" placeholder="rating 2" v-model.number="rating2" />
      </div>
    </div>
    <div class="form-row row mb-2">
      <div class="col-form-label col-3">Score</div>
      <div class="col">
        <input class="form-control" type="text" placeholder="score 1" v-model.number="score1" />
      </div>
      <div class="col">
        <input class="form-control" type="text" placeholder="score 2" v-model.number="score2" />
      </div>
    </div>
    <div class="form-group row">
      <div class="col-form-label col-3">Player level</div>
      <div class="col">
        <b-form-radio-group
            v-model="qualification1"
            :options="playerLevels"
            name="qualification1"
            stacked>
        </b-form-radio-group>
      </div>
      <div class="col">
        <b-form-radio-group
            v-model="qualification2"
            :options="playerLevels"
            name="qualification2"
            stacked>
        </b-form-radio-group>
      </div>
    </div>
    <div class="form-row row mb-2">
      <div class="col-form-label col-3">New&nbsp;rating</div>
      <div class="col">
        <input class="form-control" type="text" :value="calculationResult ? calculationResult.newRating1 + ' [' + signedNumber(calculationResult.ratingDelta1) + ']' : ''" readonly />
      </div>
      <div class="col">
        <input class="form-control" type="text" :value="calculationResult ? calculationResult.newRating2 + ' [' + signedNumber(calculationResult.ratingDelta2) + ']' : ''" readonly />
      </div>
    </div>
  </div>
</template>
<script>

const DIVIDER = 2;
const MIN_RATING = 1;

function calculateNewRating(rating1, rating2, score1, score2, qualification1, qualification2) {
  let oldRating1 = rating1;
  let oldRating2 = rating2;

  let result = calculateByConvergence(
      rating1,
      rating2,
      score1,
      score2,
      qualification1,
      qualification2);
  let newRating1 = result.newRating1;
  let newRating2 = result.newRating2;

  result = applyQualificationRules(oldRating1, oldRating2, score1, score2, qualification1, qualification2, newRating1, newRating2);
  newRating1 = result.newRating1;
  newRating2 = result.newRating2;

  let ratingDelta1 = newRating1 - oldRating1;
  let ratingDelta2 = newRating2 - oldRating2;

  return {newRating1, newRating2, ratingDelta1, ratingDelta2};
}

function applyQualificationRules(oldRating1, oldRating2, score1, score2, qualification1, qualification2, newRating1, newRating2) {
  let isQualificationGame = (qualification1 === "non-qualified") ^ (qualification2 === "non-qualified");

  if (!isQualificationGame) {
    return {newRating1, newRating2};
  }

  let ratingDelta1 = newRating1 - oldRating1;
  let ratingDelta2 = newRating2 - oldRating2;

  let newQualifiedRating1 = newRating1;
  let newQualifiedRating2 = newRating2;

  let result = calculateByConvergence(
      oldRating1,
      oldRating2,
      score1,
      score2,
      qualification1,
      qualification2,
      true);

  newQualifiedRating1 = result.newRating1;
  newQualifiedRating2 = result.newRating2;

  if (qualification1 === "non-qualified") {
    // qualified game for player 1
    // decreasing of rating should be slower than increasing
    newRating1 = newQualifiedRating1 > oldRating1 ? newQualifiedRating1 : Math.round(oldRating1 + (newQualifiedRating1 - oldRating1) / 2);
    // only positive change allowed for rated player
    //newRating2 = newRating2 - oldRating2 > 0 ? oldRating2 + ratingDelta2 / 2 : oldRating2;
    newRating2 = newRating2 - oldRating2 > 0 ? oldRating2 + ratingDelta2 : oldRating2;
  } else {
    // qualified game for player 2
    // decreasing of rating should be slower than increasing
    newRating2 = newQualifiedRating2 > oldRating2 ? newQualifiedRating2 : Math.round(oldRating2 + (newQualifiedRating2 - oldRating2) / 2);
    // only positive change allowed for rated player
    //newRating1 = newRating1 - oldRating1 > 0 ? oldRating1 + ratingDelta1 / 2 : oldRating1;
    newRating1 = newRating1 - oldRating1 > 0 ? oldRating1 + ratingDelta1 : oldRating1;
  }

  return {newRating1, newRating2};
}

function calculateByConvergence(rating1, rating2, score1, score2, qualification1, qualification2, isQualified = false) {
  let firstCalculation = true;
  let i = DIVIDER;
  while (i <= score1 + score2) {
    let {delta1, delta2} = calculateNewRatingPerSingleGame(rating1, rating2, score1, score2, qualification1, qualification2, isQualified, firstCalculation);
    firstCalculation = false;

    rating1 = getNormalizedRating(rating1, delta1);
    rating2 = getNormalizedRating(rating2, delta2);

    i += DIVIDER;
  }

  // required for proper calculation incomplete matches
  // (e.g) 2:0, 2:0, and last one is 1:0
  let multiplier = (DIVIDER - (i - (score1 + score2))) / DIVIDER;
  if (0 < multiplier && multiplier < 1)
  {
    let {delta1, delta2} = calculateNewRatingPerSingleGame(rating1, rating2, score1, score2, qualification1, qualification2, isQualified, firstCalculation);

    rating1 = getNormalizedRating(rating1, delta1, multiplier);
    rating2 = getNormalizedRating(rating2, delta2, multiplier);
  }

  let newRating1 = Math.round(rating1);
  let newRating2 = Math.round(rating2);

  return {newRating1, newRating2};
}

function calculateNewRatingPerSingleGame(rating1, rating2, score1, score2, qualification1, qualification2, isQualified, firstCalculation) {
  let delta1 = calculateDelta(
      rating1,
      rating2,
      score1,
      score2,
      getPlayerFactor(rating1, qualification1, isQualified),
      firstCalculation && rating1 - rating2 > 400); // apply rule 400 for higher level only

  // if negative delta apply rule 400 every time
  if (!firstCalculation && rating1 - rating2 > 400 && delta1 < 0) {
    delta1 = calculateDelta(
        rating1,
        rating2,
        score1,
        score2,
        getPlayerFactor(rating1, qualification1, isQualified),
        true); // apply rule 400 for higher level only
  }

  let delta2 = calculateDelta(
      rating2,
      rating1,
      score2,
      score1,
      getPlayerFactor(rating2, qualification2, isQualified),
      firstCalculation && rating2 - rating1 > 400); // apply rule 400 for higher level only

  // if negative delta apply rule 400 every time
  if (!firstCalculation && rating2 - rating1 > 400 && delta2 < 0) {
    delta2 = calculateDelta(
        rating2,
        rating1,
        score2,
        score1,
        getPlayerFactor(rating2, qualification2, isQualified),
        true);
  }

  return {delta1, delta2};
}

function getPlayerFactor(rating, qualification, isQualified) {
  // special coefficient just for not-qualified players
  if (isQualified) {
    return 170;
  }

  // return 40 if new player (less 30 games)
  if ((qualification === "less30games")) {
    return 40;
  }

  if (rating > 2400) {
    return 10;
  } else {
    return 20;
  }
}

function getNormalizedRating(rating, delta, multiplier = 1) {
  let result = rating + delta * multiplier;
  if (result < MIN_RATING) { // normalization
    result = MIN_RATING;
  }
  return result;
}

function getGameResult(score1, score2) {
  return score1 / (score1 + score2);
}

function getRatingDelta(rating1, rating2, applyRule400) {
  let delta = rating2 - rating1;

  // rule 400
  if (applyRule400 && Math.abs(delta) > 400) {
    delta = delta > 0 ? 400 : -400;
  }

  return delta;
}

function calculateDelta(rating1, rating2, score1, score2, k, applyRule400) {
  if (score1 === 0 && score2 === 0) {
    return 0;
  }

  let estimatedPoints = 1 / (1 + Math.pow(10, getRatingDelta(rating1, rating2, applyRule400) / 400));

  let gameResult = getGameResult(score1, score2);

  return k * (gameResult - estimatedPoints);
}

export default {
  data() {
      return {
        rating1: '',
        rating2: '',
        score1: '',
        score2: '',
        qualification1: "qualified",
        qualification2: "qualified",
        playerLevels: [
          {text: "≥ 30 games", value: "qualified"},
          {text: "< 30 games", value: "less30games"},
          {text: "Non-qualified", value: "non-qualified"}]
      }
  },
  computed: {
    calculationResult: function () {
      if (!Number.isInteger(this.rating1) || !Number.isInteger(this.rating2) ||
          !Number.isInteger(this.score1) || !Number.isInteger(this.score2)) {
        return;
      }
      return calculateNewRating(this.rating1, this.rating2, this.score1, this.score2, this.qualification1, this.qualification2);
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
