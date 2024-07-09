<template>
  <v-container>
    <v-row>
      <v-col>
        <h5>locale='en-US', grouping</h5>
        <v-number-input v-model="example1" locale="en-US" grouping />
        <code class="d-block pt-3">value: {{ example1 }}</code>
      </v-col>
      <v-col>
        <h5>locale='en-US', grouping, precision="2"</h5>
        <v-number-input
          v-model="example2"
          locale="en-US"
          grouping
          precision="2"
        />
        <code class="d-block pt-3">value: {{ example2 }}</code>
      </v-col>
      <v-col>
        <h5>locale='en-US' with formatter-options</h5>
        <v-number-input
          v-model="example3"
          locale="en-US"
          :formatter-options="customOptions"
        />
        <code class="d-block pt-3">value: {{ example3 }}</code>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <h5>en-US, grouping, precision=2</h5>
        <v-number-input locale="en-US" v-model="us" grouping precision="2" />
        <code class="d-block pt-3">value: {{ us }}</code>
      </v-col>
      <v-col>
        <h5>de-DE, grouping, precision=2</h5>
        <v-number-input locale="de-DE" v-model="de" grouping precision="2" />
        <code class="d-block pt-3">value: {{ de }}</code>
      </v-col>
      <v-col>
        <h5>fr-FR, grouping, precision=2</h5>
        <v-number-input locale="fr-FR" v-model="fr" grouping precision="2" />
        <code class="d-block pt-3">value: {{ fr }}</code>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    example1: 2500000,
    example2: 25.5,
    example3: 1250.501,
    us: 1000000,
    de: 20000000,
    fr: 300000000,
    customOptions: {
      useGrouping: true,
      signDisplay: "always",
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
      roundingMode: "halfExpand",
    },
  }),
};
</script>
