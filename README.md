# News Apps Graphic Kit

The News Apps Graphic Kit is a boilerplate for embeddable graphics. It was built for the Texas Tribune's [News Apps](https://twitter.com/newsapps) team, but could easily be altered to cater to other organization's/individual's needs.

## Features

- Live reloading and viewing powered by [BrowserSync](http://www.browsersync.io/)
- Compiling of Sass/SCSS with [Ruby Sass](http://sass-lang.com/)
- CSS prefixing with [autoprefixer](https://github.com/postcss/autoprefixer)
- CSS sourcemaps with [gulp-sourcemaps](https://www.npmjs.com/package/gulp-sourcemaps)
- CSS compression with [csso](https://github.com/css/csso)
- JavaScript linting with [jshint](http://jshint.com/)
- JavaScript compression with [uglifyjs](https://github.com/mishoo/UglifyJS2)
- Template compiling with [nunjucks](http://mozilla.github.io/nunjucks/)
- Image compression with [gulp-imagemin](https://github.com/sindresorhus/gulp-imagemin)
- Asset revisioning with [gulp-rev](https://github.com/sindresorhus/gulp-rev) and [gulp-rev-replace](https://github.com/jamesknelson/gulp-rev-replace)
- [pym.js](http://blog.apps.npr.org/pym.js/) included by default for easy embedding in hostile CMS environments

## Quickstart

Run this command in your project's folder:

```sh
curl -fsSL https://github.com/texastribune/newsapps-graphic-kit/archive/master.tar.gz | tar -xz --strip-components=1
```

Next, `npm install`.

If this is your first time to ever use the kit, you need to authorize your computer: `npm run spreadsheet/authorize`


Add your Google sheet's ID to the `config.json`, and override any sheets that need to be processed differently. (`keyvalue` or `objectlist`)

Get to work!

## Connect to S3

To use the commands to deploy your project to Amazon S3, you'll need to add a [profile newsapps] to ~/.aws/config. It should look something like this:

```
[profile newsapps]
aws_access_key_id=YOUR_UNIQUE_ID
aws_secret_access_key=YOUR_SECRET_ACCESS_KEY
```

Then you can run these commands to build and deploy:

```
gulp
npm run deploy
```

The package will deploy to graphics.texastribune.org/donor-wall. To change the location, update the package.json file.

## Assets

The graphics kit comes with an empty app/assets folder for you to store images, fonts and data files. The kit works best if you add these files to app/assets/images, app/assets/fonts and app/assets/data. These files will automatically be ignored by git hub, if added to the proper folders, to prevent a storage overload and to keep files locally that may have sensitive information in an open source project.

*[Yeoman](http://yeoman.io/) is being considered.*

## Available Commands

```sh
npm run spreadsheet/authorize
```
Allows your computer to interact with the scraper. Only needs to be done once! Any future uses of the graphic kit can skip this.

```sh
npm run spreadsheet/fetch
```
Pulls down the project's spreadsheet and processes it into the `data.json` file.

```sh
npm run spreadsheet/edit
```
Opens the project's spreadsheet in your browser.

```sh
npm run deploy
```
Deploys the project.

```sh
npm run assets/push
```
Pushes the raw assets to the S3 bucket.

```sh
npm run assets/pull
```
Pulls the raw assets down to the local environment.
