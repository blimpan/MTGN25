# MTGN.nu 2025

Next.js web app created for the Chapter of Media Technology's reception of newly admitted students.


## Running project locally

### Prerequisites
- Node.js v20+
- `.env.local` file with environment variables located in root folder.

### Instructions
- Clone repo
- Navigate to root folder (where file `package.json` is located).
- Install required dependencies by running `npm install`
- Start development server by running `npm run dev`

- Go to [http://localhost:3000](http://localhost:3000) in your browser.

## Contributing/workflow
- Find an open issue not being worked on [here](https://github.com/blimpan/MTGN25/issues) and assign yourself to it.
- If it requires visual work, make a design first before writing code.
- When you start writing code, make sure you work on your own branch and follow the naming convention `name/category/description-of-work`, e.g. `linus/feature/rework-video-page` or `edvin/bugfix/login-button-hidden-mobile`. The category `feature` is for adding, refactoring or removing a feature and `bugfix` is for fixing a bug.
- When you are done, try running `npm run build` and see if any compilation errors occur during the build process.
- Make a pull request to the `dev` branch and have someone check your work.