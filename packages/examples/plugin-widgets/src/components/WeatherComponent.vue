<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import InternalCard from './internals/InternalCard.vue';

// https://www.iconfinder.com/icons/2682841/cloud_cloudy_forecast_storm_weather_wind_windy_icon
import IsDay from '@/assets/2682848_day_forecast_sun_sunny_weather_icon.svg';
import IsNight from '@/assets/2682847_eclipse_forecast_moon_night_space_icon.svg';
import IsCloudyDay from '@/assets/2682849_cloud_cloudy_day_forecast_sun_icon.svg';
import IsCloudyNight from '@/assets/2682846_cloud_cloudy_forecast_moon_night_icon.svg';
import Precipitation from '@/assets/2682835_cloud_cloudy_forecast_precipitation_rain_icon.svg';
import Wind from '@/assets/2682842_breeze_fast_speed_weather_wind_icon.svg';

const { message = 'No message' } = defineProps<{ message: string }>();

const weather = ref();
const mainIcon = ref(IsDay);

const fetchWeather = async () => {
  navigator.geolocation.getCurrentPosition(
    // Success callback.
    async (position: any) => {
      const lat = position.coords.latitude.toFixed(2);
      const long = position.coords.longitude.toFixed(2);

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${long}&current=temperature_2m,is_day,rain,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=auto`
      );
      weather.value = await weatherRes.json();
      // console.log('WEATHER', weather.value);

      switch (weather.value.current.is_day) {
        case 0: {
          // Night
          if (weather.value.current.cloud_cover > 20) {
            mainIcon.value = IsCloudyNight;
          } else {
            mainIcon.value = IsNight;
          }
          break;
        }
        case 1: {
          // Day
          if (weather.value.current.cloud_cover > 20) {
            mainIcon.value = IsCloudyDay;
          } else {
            mainIcon.value = IsDay;
          }
          break;
        }
      }
    },
    (err: unknown) => {
      console.error('An error occurred.');
      console.error(err);
    }
  );
};

onBeforeMount(async () => {
  await fetchWeather();
});
</script>

<template lang="pug">
internal-card 
  template(
    v-slot:header,
    @click="fetchWeather"
  ).header-slot
    .main-header(v-if="weather") 
      img(
        :src="mainIcon"
      ).header-icon
      .temp-header {{ weather.current.temperature_2m }} {{ weather.current_units.temperature_2m }}
      .weather-site
        slot(
          name="header",
        ) 
          .lat-long(
            v-if="weather"
          ) 
            div lat.: {{ weather.latitude }}
            div long.: {{ weather.longitude }}
  .weather-resume(v-if="weather")
    .weather-item
      img(:src="Precipitation") 
      h2(v-if="weather") {{ weather.current.rain }} {{ weather.current_units.rain }}
    .weather-item
      img(:src="Wind") 
      h2(v-if="weather") {{ weather.current.wind_speed_10m }} {{ weather.current_units.wind_speed_10m }}
    // pre {{ weather }}
  .weather-resume(v-else) Click to fetch.
  template(v-slot:footer)
    .weather-footer(
      v-if="weather"
    ) Fetched on {{ weather.current.time }} 
      .message {{ message }}
</template>

<style lang="sass" scoped>
.main-header
  display: flex
  align-items: center
  padding-bottom: 1.5rem
  white-space: nowrap

  .temp-header
    margin: 0 1rem
    margin-right: 1rem

.header-icon
  height: 5rem

.weather-resume
  line-height: 1rem
  &:first-child
    margin-top: 1rem
  &:last-child
    margin-bottom: 1rem

.weather-item
  display: flex
  align-items: center
  justify-content: space-between
  img
    height: 3rem

.weather-site
  display: flex
  flex-direction: column

  .lat-long
    font-size: 0.8rem
    margin-left: 1rem

.weather-footer
  .message
    font-size: 0.8rem
    color: rgb(0, 128, 64)
</style>
