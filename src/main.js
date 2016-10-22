import Vue from 'vue';

require('../sass/main.scss');

new Vue({
    el: '#app',
    data: {
        goodsList: [
            {name: '小米5s', price: 1999, selected: false},
            {name: '小米5s plus', price: 2299, selected: false},
            {name: '红米Pro', price: 1499, selected: false},
            {name: '小米Max', price: 1299, selected: false},
        ],
        atLeast1300: false
    },
    methods: {
        selectGoods: function(goods) {
            goods.selected = !goods.selected;
        }
    },
    computed: {
        totalPrice: function() {
            /*var total = 0;
            for (var i = 0; i < this.selectedGoods.length; i++) {
                total += this.selectedGoods[i].price;
            }
            return total;*/

            var total = 0;
            var self = this;
            this.goodsList.forEach(function(goods) {
                if (goods.selected && (!self.atLeast1300 || goods.price >= 1300)) {
                    total += goods.price;
                }
            });
            return total;
        }
    }
});