<template>
    <div class="v-header">{{title}}</div>
</template>

<script>
    export default {
        tagName: 'v-header',
        props: ['title'],
        data() {
            return {};
        }
    }
</script>

<style lang="sass">
    @import "../../sass/Header.scss";
</style>