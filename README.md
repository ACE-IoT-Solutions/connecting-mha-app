# Open HEMS App
A React Native app demonstrating HEMS API interactions featuring a user-friendly thermostat and other tools with eco-friendly suggestions.

![Simulator Screenshot - iPhone 15 Pro Max - 2024-03-08 at 15 24 59](https://github.com/ACE-IoT-Solutions/connecting-mha-app/assets/94999450/e6e87957-4074-46c9-a770-12bf82c1835d)


## Getting Started
#### Install Dependencies
```
yarn
```

#### Build App Locally or through EAS
Android:
```
yarn run android
eas build --platform android --local
```
iOS:
```
yarn run ios
eas build --platform ios --local
```

#### Run App Locally or through EAS
```
yarn start
```

### Build Project on expo.dev
You'll need to be authenticated with eas - see the [eas build documentation](https://docs.expo.dev/build/introduction/) for more detail
```
eas build --platform all --profile acceptance --non-interactive
```
