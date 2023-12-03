export default Array = window.Array;

Object.defineProperty(Array.prototype, 'clean', {
  value: function (deleteValue) {
    for (let i = 0; i < this.length; i++) {
      if (this[i] === deleteValue) {
        this.splice(i, 1);
        i--;
      }
    }
    return this;
  },
  enumerable: false,
});

Object.defineProperty(Array.prototype, 'extend', {
  value: function (otherArray) {
    otherArray.forEach(function (v) {
      this.push(v);
    }, this);
  },
  enumerable: false,
});

Object.defineProperty(Array.prototype, 'contains', {
  value: function (value) {
    return this.indexOf(value) > -1;
  },
  enumerable: false,
});
