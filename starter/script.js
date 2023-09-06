'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class Workout {
  date = new Date();
  //creating unique id taking last 10 numbers
  id = (Date.now() + ' ').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; //in km
    this.duration = duration; //in mins
  }
  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${
      this.type.slice(0, 1).toUpperCase() + this.type.slice(1)
    } on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.clacPace();
    this._setDescription();
  }
  clacPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //Km/H
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
// const run1 = new Running([30, 30], 47, 2, 10);
// const cycl1 = new Cycling([30, 30], 50, 10, 850);
// console.log(run1, cycl1);
/////////////////////////////////
//APPLICATION ARCHITECTURE
class App {
  #map;
  #mapEvent;
  #workouts = [];

  constructor() {
    //Get user's Position
    this._getPosition();
    //loading data
    this._getLocalStorage();
    //attach eventHandlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElvationField);
    containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));
  }
  _moveToPopUp(e) {
    let workoutEl = e.target;
    if (workoutEl.classList.contains('form__btn')) return;
    if (workoutEl.closest('.workout')) {
      workoutEl = e.target.closest('.workout');
      console.log(workoutEl);
      const obj = this.#workouts.find(el => el.id === workoutEl.dataset.id);
      console.log(obj);
      this.#map.off();
      // this.#map.remove();
      this.#map.setView(obj.coords, 10, {
        animate: true,
        pan: {
          duration: 1,
        },
      });
      this.#map.on('click', this._showForm.bind(this));
    }
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        aler(`Can't get access to your current location`);
      }
    );
  }
  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const cords = [latitude, longitude];
    this.#map = L.map('map').setView(cords, 10);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputCadence.value =
      inputDuration.value =
      inputElevation.value =
      inputType.value =
        ' ';
    //doing that the new workout comes in the place of the form!
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _toggleElvationField() {
    if (inputType.value === 'cycling') {
      inputCadence.parentElement.classList.add('form__row--hidden');
      inputElevation.parentElement.classList.remove('form__row--hidden');
    } else if (inputType.value === 'running') {
      inputElevation.parentElement.classList.add('form__row--hidden');
      inputCadence.parentElement.classList.remove('form__row--hidden');
    }
  }
  _newWorkout(e) {
    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const positveInputs = (...inputs) => inputs.every(inp => inp >= 0);
    const emptyInputs = (...inputs) => inputs.some(inp => inp == '0');
    e.preventDefault();
    //getting data from the form
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    const lat = this.#mapEvent.latlng.lat;
    const lng = this.#mapEvent.latlng.lng;
    let workout = '';
    //check if they are valid
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!validInput(duration, distance, cadence)) {
        alert('Enter Numeric Values');
        return;
      }
      if (!positveInputs(duration, distance, cadence)) {
        alert('Enter Positive Values');
        return;
      }
      if (emptyInputs(duration, distance, cadence)) {
        alert('Enter The Missing Values');
        return;
      }
      workout = new Running([lat, lng], distance, duration, cadence);
    } else if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (!validInput(duration, distance, elevationGain)) {
        alert('Enter Numeric Values');
        return;
      }
      if (!positveInputs(duration, distance)) {
        alert('Enter Positive Values');
        return;
      }
      if (emptyInputs(duration, distance, elevationGain)) {
        alert('Enter The Missing Values');
        return;
      }
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    } else {
      alert('Please choose the type of workout');
      return;
    }
    this.#workouts.push(workout);
    //rendering workout as the mark
    this._renderWorkoutMarker(workout);
    //rending workout on list
    this._renderWorkout(workout);
    //Clear Input Fields
    this._hideForm();
    //adding them to local storage
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 150,
          autoClose: false,
          closeOnClick: false,
          closeOnEscapeKey: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
     <span class="workout__icon">⏱</span>
     <span class="workout__value">${workout.duration}</span>
     <span class="workout__unit">min</span>
    </div>`;
    if (workout.type === 'running') {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>`;
    } else {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>`;
    }
    containerWorkouts.insertAdjacentHTML('beforeend', html);
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    //We can't put the marks on map right now because map isn't loaded yet
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
  }
}

const app = new App();
