
# Nightwatchjs - nx plugin

This nx plugin sets up Nightwatch for you to be able to run your E2E tests.

## Installation

To install you will need to do

```bash
npm i @nightwatch/nx --save-dev
```

## Generating a project

```bash
nx g @nightwatch/nx:nightwatch-project
```

## Writing Tests

To write your tests please follow the documentation on the [Nightwatchjs.org](https://www.nightwatchjs.org) site.

## Running Tests

When you have written your tests you can run them with the following command

```bash
nx e2e my-app-e2e
```

NightwatchJS arguments will be forwarded on from nx
