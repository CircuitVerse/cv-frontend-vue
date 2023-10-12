# GSoC'22 Project - [WIP]VueJS Simulator

## New Frontend Framework for Simulator UI.
- [Phase-1 Report](https://blog.circuitverse.org/posts/devjitchoudhury_gsoc22_phase1_report/)
- [Phase-2 Report](https://blog.circuitverse.org/posts/devjitchoudhury_gsoc22_phase2_report/)

### Project Goals - 
1. Replacing JqueryUI with a modern frontend framework.
2. Decoupling the Simulator from backend
3. Dividing into Components
4. State Management
5. Refactoring CSS
6. Internationalization using Vue-i18n


### To Dos -
1. **Vue Project Integration** into the Main Repository or finding a way for the simulators in two different repositories to work in sync.
2. **API Integration and Testing**
3. **Embed Feature** - Discuss and implement the embeding of circuits feature.
4. **Internationalization of Simulator** - Internationalization is already set up using Vue-i18n but progressive work needs to be done on it.
5. **Refactoring of Styles** - Refactor the global stylesheet to local stylesheets for individual components. There is also a scope of removing SASS using modern CSS features.
6. Few components - Verilog Module, Quick-Button, Testbench, and Timing-Diagram are yet to be converted to Vue. 
7. With the removal of jQuery-UI, there is also a scope of removing the use of jQuery from the project.


### Contributing - 

Before you start contributing please make  sure you read through the [Contribution Guidelines](CONTRIBUTING.md) 

### Setup -

#### Prerequisites
Before starting, please make sure you have installed [NodeJs](https://nodejs.org/en/download/) on your machine.

Follow below mentioned instructions to manually setup the project (Local Environment).

 - First fork the original repository and clone your forked repository into your local machine. If you dont do this you wont be able to make commits or change any files.
```sh
git clone https://github.com/<username>/cv-frontend-vue.git
cd cv-frontend-vue
```
 - Install all the required dependencies for this project.
```sh
npm install 
```
 - Run the development server using the below command and navigate to `localhost:3000` in your web browser to access the website.
```sh
npm run dev 
```
