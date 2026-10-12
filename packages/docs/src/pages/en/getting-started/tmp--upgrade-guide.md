### VDatePicker

Day buttons follow the Material Design 3 spec: 40px instead of 36px, with a `1.5rem` line-height. To keep the previous look:

```scss { resource="src/styles/settings.scss" }
@use 'vuetify/settings' with (
  $date-picker-month-day-btn-size: 36px,
  $date-picker-month-day-btn-line-height: normal,
);
```
