<template>
  <v-container>
    <v-row>
      <v-col>
        <h5>(precision="0")</h5>
        <v-number-input v-model="example1" hide-details="auto" precision="0" />
        <code class="d-block pt-3">value: {{ example1 }}</code>
      </v-col>
      <v-col>
        <h5>(precision="2")</h5>
        <v-number-input v-model="example2" hide-details="auto" precision="2" />
        <code class="d-block pt-3">value: {{ example2 }}</code>
      </v-col>
      <v-col>
        <h5>(precision="5")</h5>
        <v-number-input v-model="example3" hide-details="auto" precision="5" />
        <code class="d-block pt-3">value: {{ example3 }}</code>
      </v-col>
      <v-col> </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    example1: 123,
    example2: 25.5,
    example3: 0.052,
  }),
};
</script>
