/* eslint-disable func-names */
/* eslint-disable no-global-assign */
/* eslint-disable no-extend-native */
export default Array = window.Array

Object.defineProperty(Array.prototype, 'clean', {
    value: function (deleteValue: unknown) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === deleteValue) {
                this.splice(i, 1)
                i--
            }
        }
        return this
    },
    enumerable: false,
})

Object.defineProperty(Array.prototype, 'extend', {
    value: function (otherArray: unknown[]) {
        /* you should include a test to check whether other_array really is an array */
        otherArray.forEach( (v) => {
            this.push(v)
        }, this)
    },
    enumerable: false,
})

Object.defineProperty(Array.prototype, 'contains', {
    value: function (value: unknown) {
        return this.indexOf(value) > -1
    },
    enumerable: false,
})
